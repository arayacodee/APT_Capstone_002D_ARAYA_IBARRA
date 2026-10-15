import type { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { cancelSafely, completeSafely, ReservationConflict } from "../lib/reservation-state.js";

const createReservationSchema =
  z.object({
    serviceId: z.string().uuid(),

    startsAt: z.string().refine(
      (value) =>
        !Number.isNaN(
          Date.parse(value)
        ),
      "Fecha Incorrecta"
    )
});

const completeReservationSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(1500)
    .optional(),
});

const weekdayMap: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

const getLocalDateParts = (date: Date, timeZone: string) => {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);

  const datePart = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

  return {
    dayOfWeek: weekdayMap[weekday],
    datePart,
    time,
  };
};

const isPrismaRetryableError = (error: unknown) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "P2034"
  );
};

export const createReservation = async (
  req: Request,
  res: Response
) => {
  const result = createReservationSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: "Invalid request data",
      details: result.error.flatten(),
    });
  }

  const {
    serviceId,
    startsAt
  } = result.data;

  const clientId =
    req.authUser!.id;

  const reservationStart = new Date(startsAt);

  if (reservationStart <= new Date()) {
    return res.status(400).json({
      error: "Reservation must be in the future",
    });
  }

  try {
    const service = await prisma.service.findUnique({
      where: {
        id: serviceId,
      },
      include: {
        business: true,
      },
    });

    if (!service) {
      return res.status(404).json({
        error: "Service not found",
      });
    }

    if (!service.isActive) {
      return res.status(409).json({
        error: "Service is not active",
      });
    }

    const client = await prisma.user.findUnique({
      where: {
        id: clientId,
      },
    });

    if (!client) {
      return res.status(404).json({
        error: "Client not found",
      });
    }

    if (client.role !== "CLIENT") {
      return res.status(403).json({
        error: "Only client users can create reservations",
      });
    }

    const reservationEnd = new Date(
      reservationStart.getTime() + service.durationMin * 60_000
    );

    const timeZone = service.business.timezone;

    const localStart = getLocalDateParts(
      reservationStart,
      timeZone
    );

    const localEnd = getLocalDateParts(
      reservationEnd,
      timeZone
    );

    if (localStart.datePart !== localEnd.datePart) {
      return res.status(409).json({
        error: "Reservation cannot cross into another day",
      });
    }

    const availability = await prisma.availability.findFirst({
      where: {
        businessId: service.businessId,
        dayOfWeek: localStart.dayOfWeek,
        isActive: true,
        startTime: {
          lte: localStart.time,
        },
        endTime: {
          gte: localEnd.time,
        },
      },
    });

    if (!availability) {
      return res.status(409).json({
        error: "Requested time is outside business availability",
      });
    }

    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const reservation = await prisma.$transaction(
          async (tx) => {
            const overlappingReservation =
              await tx.reservation.findFirst({
                where: {
                  businessId: service.businessId,
                  status: {
                    not: "CANCELLED",
                  },
                  startsAt: {
                    lt: reservationEnd,
                  },
                  endsAt: {
                    gt: reservationStart,
                  },
                },
              });

            if (overlappingReservation) {
              return null;
            }

            return tx.reservation.create({
              data: {
                businessId: service.businessId,
                serviceId,
                clientId,
                startsAt: reservationStart,
                endsAt: reservationEnd,
              },
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    durationMin: true,
                    price: true,
                  },
                },
                client: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
                business: {
                  select: {
                    id: true,
                    name: true,
                    timezone: true,
                  },
                },
              },
            });
          },
          {
            isolationLevel: "Serializable",
          }
        );

        if (!reservation) {
          return res.status(409).json({
            error: "Requested time overlaps an existing reservation",
          });
        }

        return res.status(201).json(reservation);
      } catch (error) {
        if (isPrismaRetryableError(error)) {
          if (attempt < maxAttempts) continue;
          return res.status(409).json({
            error: "El horario cambió mientras reservabas. Actualiza los horarios e intenta nuevamente.",
          });
        }

        throw error;
      }
    }

    return res.status(409).json({
      error: "Could not create reservation due to concurrent requests",
    });
  } catch (error) {
    console.error("Create reservation error:", error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const getReservations = async (
  req: Request,
  res: Response
) => {
  try {
    const user = req.authUser!;

    const requestedBusinessId =
      typeof req.query.businessId === "string"
        ? req.query.businessId
        : undefined;

    if (user.role === "CLIENT") {
      const reservations =
        await prisma.reservation.findMany({
          where: {
            clientId: user.id
          },

          include: {
            business: true,
            service: true
          },

          orderBy: {
            startsAt: "asc"
          }
        });

      return res.status(200).json(
        reservations
      );
    }

    const reservations =
      await prisma.reservation.findMany({
        where: {
          business: {
            ownerId: user.id
          },

          ...(requestedBusinessId
            ? {
                businessId:
                  requestedBusinessId
              }
            : {})
        },

        include: {
          business: true,
          service: true,

          client: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },

        orderBy: {
          startsAt: "asc"
        }
      });

    return res.status(200).json(
      reservations
    );
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error:
        "Unable to load reservations"
    });
  }
};

export const getReservationById = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  try {
    const reservation =
      await prisma.reservation.findUnique({
        where: {
          id: req.params.id,
        },

        include: {
          business: true,
          service: true,

          client: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    if (!reservation) {
      return res.status(404).json({
        error: "Reservation not found",
      });
    }

    const user = req.authUser!;

    if (
      user.role === "CLIENT" &&
      reservation.clientId !== user.id
    ) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    if (
      user.role === "PROFESSIONAL" &&
      reservation.business.ownerId !== user.id
    ) {
      return res.status(403).json({
        error: "Forbidden",
      });
    }

    return res.status(200).json(reservation);
  } catch (error) {
    console.error(
      "Get reservation error:",
      error
    );

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

export const cancelReservation = async (req: Request<{ id: string }>, res: Response) => {
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id }, include: { business: true } });
    if (!reservation) return res.status(404).json({ error: "Reserva no encontrada." });
    const user = req.authUser!;
    const allowed = user.role === "SUPERADMIN" || (user.role === "CLIENT" ? reservation.clientId === user.id : reservation.business.ownerId === user.id);
    if (!allowed) return res.status(403).json({ error: "Forbidden" });
    const cancelled = await prisma.$transaction(tx => cancelSafely(tx, reservation.id));
    return res.json(cancelled);
  } catch (error) {
    if (error instanceof ReservationConflict) return res.status(409).json({ error: error.message });
    console.error("Cancel reservation error:", error);
    return res.status(500).json({ error: "No fue posible cancelar la reserva." });
  }
};

export const completeReservation = async (req: Request<{ id: string }>, res: Response) => {
  const result = completeReservationSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: "Nota inválida.", details: result.error.flatten() });
  try {
    const reservation = await prisma.reservation.findUnique({ where: { id: req.params.id }, include: { business: true } });
    if (!reservation) return res.status(404).json({ error: "Reserva no encontrada." });
    if (req.authUser!.role !== "SUPERADMIN" && reservation.business.ownerId !== req.authUser!.id) return res.status(403).json({ error: "Forbidden" });
    const completed = await prisma.$transaction(tx => completeSafely(tx, reservation.id, result.data.notes));
    return res.json(completed);
  } catch (error) {
    if (error instanceof ReservationConflict) return res.status(409).json({ error: error.message });
    console.error("Complete reservation error:", error);
    return res.status(500).json({ error: "No fue posible registrar la atención." });
  }
};
