import type { Prisma } from '../generated/prisma/client.js';

export type AdminResource = 'users' | 'businesses' | 'services' | 'availabilities' | 'reservations' | 'sessions' | 'evidences';
export class DeletionError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// Delete children before parents inside one serializable transaction. Files are cleaned only after commit.
export async function deleteAdminRecord(tx: Prisma.TransactionClient, resource: AdminResource, id: string, actorId: string): Promise<string[]> {
  const images: string[] = [];
  let sessions: Prisma.ClientSessionWhereInput | undefined;
  let reservations: Prisma.ReservationWhereInput | undefined;
  let businesses: Prisma.BusinessWhereInput | undefined;
  let services: Prisma.ServiceWhereInput | undefined;
  const where = { id };
  switch (resource) {
    case 'users': {
      const user = await tx.user.findUnique({ where });
      if (!user) throw new DeletionError(404, 'Usuario inexistente.');
      if (user.role === 'SUPERADMIN' || user.id === actorId) throw new DeletionError(409, 'No se pueden eliminar cuentas superadmin.');
      businesses = { ownerId: id };
      services = { business: { ownerId: id } };
      reservations = { OR: [{ clientId: id }, { business: { ownerId: id } }] };
      sessions = { OR: [{ clientId: id }, { business: { ownerId: id } }] };
      break;
    }
    case 'businesses':
      if (!await tx.business.findUnique({ where })) throw new DeletionError(404, 'Negocio inexistente.');
      businesses = where; services = { businessId: id }; reservations = { businessId: id }; sessions = { businessId: id }; break;
    case 'services':
      if (!await tx.service.findUnique({ where })) throw new DeletionError(404, 'Servicio inexistente.');
      services = where; reservations = { serviceId: id }; sessions = { reservation: { serviceId: id } }; break;
    case 'reservations':
      if (!await tx.reservation.findUnique({ where })) throw new DeletionError(404, 'Reserva inexistente.');
      reservations = where; sessions = { reservationId: id }; break;
    case 'sessions': {
      const session = await tx.clientSession.findUnique({ where });
      if (!session) throw new DeletionError(404, 'Atención inexistente.');
      // A completed reservation must not remain without its linked attention.
      reservations = { id: session.reservationId }; sessions = where; break;
    }
    case 'availabilities':
      await tx.availability.delete({ where }); return images;
    case 'evidences': {
      const evidence = await tx.sessionEvidence.delete({ where });
      images.push(evidence.imagePublicId); return images;
    }
  }
  if (sessions) {
    const evidenceWhere: Prisma.SessionEvidenceWhereInput = { session: sessions };
    const evidences = await tx.sessionEvidence.findMany({ where: evidenceWhere, select: { imagePublicId: true } });
    images.push(...evidences.map(item => item.imagePublicId));
    await tx.sessionEvidence.deleteMany({ where: evidenceWhere });
    await tx.clientSession.deleteMany({ where: sessions });
  }
  if (reservations) await tx.reservation.deleteMany({ where: reservations });
  if (services) await tx.service.deleteMany({ where: services });
  if (businesses) {
    const galleryImages = await tx.businessPhoto.findMany({ where: { business: businesses }, select: { imagePublicId: true } });
    images.push(...galleryImages.map(item => item.imagePublicId));
    const businessImages = await tx.business.findMany({ where: businesses, select: { avatarPublicId: true, coverPublicId: true } });
    for (const business of businessImages) {
      if (business.avatarPublicId) images.push(business.avatarPublicId);
      if (business.coverPublicId) images.push(business.coverPublicId);
    }
    await tx.availability.deleteMany({ where: { business: businesses } });
    await tx.business.deleteMany({ where: businesses });
  }
  if (resource === 'users') {
    const result = await tx.user.deleteMany({ where: { id, role: { not: 'SUPERADMIN' } } });
    if (!result.count) throw new DeletionError(409, 'El usuario cambió. Actualiza la lista antes de eliminarlo.');
  }
  return [...new Set(images)];
}
