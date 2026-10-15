import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  computed,
  signal
} from '@angular/core';

import {
  Router,
  RouterLink
} from '@angular/router';

import { forkJoin, interval } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

import { User } from '../../models/user.model';
import { Business } from '../../models/business.model';
import { businessLabels } from '../../models/business-category';
import { Service } from '../../models/service.model';
import { Availability } from '../../models/availability.model';
import { Reservation } from '../../models/reservation.model';

@Component({
  selector: 'app-professional-dashboard',
  imports: [RouterLink],
  templateUrl: './professional-dashboard.html',
  styleUrl: './professional-dashboard.css'
})
export class ProfessionalDashboard implements OnInit {
  readonly labels = computed(() => businessLabels(this.business()?.category));
  private readonly destroyRef = inject(DestroyRef);
  readonly now = signal(new Date());

  professional = signal<User | null>(null);
  business = signal<Business | null>(null);

  services = signal<Service[]>([]);
  availabilities = signal<Availability[]>([]);
  reservations = signal<Reservation[]>([]);

  loading = signal(true);

  completingReservationId =
    signal<string | null>(null);

  errorMessage = signal('');
  successMessage = signal('');

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    interval(1000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.now.set(new Date()));
    this.loadDashboard();
  }

  private loadDashboard(): void {
    const professional =
      this.auth.currentUser();

    if (
      !professional ||
      professional.role !== 'PROFESSIONAL'
    ) {
      this.router.navigate(['/login']);
      return;
    }

    this.professional.set(professional);

    // /businesses/me obtiene el perfil asociado
    // directamente al usuario autenticado.
    this.api.getMyBusiness().subscribe({
      next: (business) => {
        this.business.set(business);

        this.loadBusinessData(
          business.id
        );
      },

      error: (error) => {
        if (error.status === 404) {
          this.router.navigate([
            '/professional/setup'
          ]);

          return;
        }

        console.error(error);

        this.errorMessage.set(
          'No fue posible cargar el dashboard.'
        );

        this.loading.set(false);
      }
    });
  }

  private loadBusinessData(
    businessId: string
  ): void {
    forkJoin({
      services:
        this.api.getServicesByBusiness(
          businessId
        ),

      availabilities:
        this.api.getAvailabilitiesByBusiness(
          businessId
        ),

      reservations:
        this.api.getReservationsByBusiness(
          businessId
        )
    }).subscribe({
      next: ({
        services,
        availabilities,
        reservations
      }) => {
        this.services.set(services);

        this.availabilities.set(
          [...availabilities].sort(
            (a, b) =>
              a.dayOfWeek - b.dayOfWeek ||
              a.startTime.localeCompare(
                b.startTime
              )
          )
        );

        this.reservations.set(
          [...reservations].sort(
            (a, b) =>
              new Date(
                a.startsAt
              ).getTime() -
              new Date(
                b.startsAt
              ).getTime()
          )
        );

        this.loading.set(false);
      },

      error: (error) => {
        console.error(error);

        this.errorMessage.set(
          'No fue posible cargar los datos del negocio.'
        );

        this.loading.set(false);
      }
    });
  }

  completeReservation(
    reservationId: string
  ): void {
    if (this.completingReservationId()) return;
    const notes = window.prompt(
      'Puedes agregar una nota de atención (opcional):'
    );

    if (notes === null) {
      return;
    }

    this.completingReservationId.set(
      reservationId
    );

    this.errorMessage.set('');
    this.successMessage.set('');

    this.api
      .completeReservation(
        reservationId,
        notes
      )
      .subscribe({
        next: () => {
          this.successMessage.set(
            'Atención registrada correctamente.'
          );

          // Reflejamos COMPLETED localmente para retirar
          // la reserva de las listas pendientes.
          this.reservations.update(
            (reservations) =>
              reservations.map(
                (reservation) =>
                  reservation.id ===
                    reservationId
                    ? {
                        ...reservation,
                        status: 'COMPLETED'
                      }
                    : reservation
              )
          );

          this.completingReservationId.set(
            null
          );
        },

        error: (error) => {
          console.error(error);

          this.errorMessage.set(
            error?.error?.error ??
              'No fue posible registrar la atención.'
          );

          this.completingReservationId.set(
            null
          );
        }
      });
  }

  activeServicesCount(): number {
    return this.services().filter(
      (service) => service.isActive
    ).length;
  }

  confirmedReservationsCount(): number {
    return this.reservations().filter(
      (reservation) =>
        reservation.status === 'CONFIRMED'
    ).length;
  }

  upcomingReservations = computed(() => {
    const now = this.now();

    // Próximas reservas son las confirmadas
    // cuya hora todavía no ha llegado.
    return this.reservations()
      .filter(
        (reservation) =>
          reservation.status ===
            'CONFIRMED' &&
          new Date(
            reservation.startsAt
          ) > now
      )
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime()
      );
  });

  pendingAttentionReservations =
    computed(() => {
      const now = this.now();

      // Estas reservas ya ocurrieron pero continúan
      // CONFIRMED, por lo que falta registrar la atención.
      return this.reservations()
        .filter(
          (reservation) =>
            reservation.status ===
              'CONFIRMED' &&
            new Date(
              reservation.startsAt
            ) <= now
        )
        .sort(
          (a, b) =>
            new Date(
              b.startsAt
            ).getTime() -
            new Date(
              a.startsAt
            ).getTime()
        );
    });

  dayName(day: number): string {
    const days:
      Record<number, string> = {
        1: 'Lunes',
        2: 'Martes',
        3: 'Miércoles',
        4: 'Jueves',
        5: 'Viernes',
        6: 'Sábado',
        7: 'Domingo'
      };

    return days[day] ?? 'Día';
  }

  formatDate(value: string): string {
    const business =
      this.business();

    return new Intl.DateTimeFormat(
      'es-CL',
      {
        dateStyle: 'medium',
        timeZone:
          business?.timezone
      }
    ).format(
      new Date(value)
    );
  }

  formatTime(value: string): string {
    const business =
      this.business();

    return new Intl.DateTimeFormat(
      'es-CL',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone:
          business?.timezone
      }
    ).format(
      new Date(value)
    );
  }

  formatPrice(
    price: string | number
  ): string {
    return new Intl.NumberFormat(
      'es-CL',
      {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
      }
    ).format(
      Number(price)
    );
  }
}
