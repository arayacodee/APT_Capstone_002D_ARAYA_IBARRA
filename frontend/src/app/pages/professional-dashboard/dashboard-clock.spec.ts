import { TestBed } from '@angular/core/testing';
import { ProfessionalDashboard } from './professional-dashboard';
import { testProviders } from '../../testing/test-providers';
import { Reservation } from '../../models/reservation.model';

describe('Reloj del dashboard', () => {
  it('mueve una reserva a atenciones pendientes al llegar su hora', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-05T12:00:00Z'));
    TestBed.configureTestingModule({ imports: [ProfessionalDashboard], providers: testProviders() });
    const fixture = TestBed.createComponent(ProfessionalDashboard);
    const component = fixture.componentInstance;
    component.reservations.set([{ id: 'reservation', startsAt: '2026-10-05T12:00:01Z', status: 'CONFIRMED' } as Reservation]);
    fixture.detectChanges();
    expect(component.upcomingReservations().length).toBe(1);
    expect(component.pendingAttentionReservations().length).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(component.upcomingReservations().length).toBe(0);
    expect(component.pendingAttentionReservations().length).toBe(1);
    fixture.destroy();
    vi.useRealTimers();
  });
});
