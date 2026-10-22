import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { AttentionMetrics } from './attention-metrics';

describe('Métricas del panel', () => {
  it('muestra el mes de la API y actualiza al cambiar de mes en la zona del negocio', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-01T02:59:59Z'));
    const metrics = { month: '2026-10', timezone: 'America/Santiago', todayCount: 2, monthCount: 12, uniqueClients: 8, revenue: 180000, daily: [{ date: '2026-10-31', count: 2 }] };
    const getAttentionMetrics = vi.fn().mockReturnValue(of(metrics));
    TestBed.configureTestingModule({ imports: [AttentionMetrics], providers: [{ provide: ApiService, useValue: { getAttentionMetrics } }] });
    const fixture = TestBed.createComponent(AttentionMetrics); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('octubre de 2026');
    expect(fixture.nativeElement.textContent).toContain('$180.000');
    getAttentionMetrics.mockReturnValue(of({ ...metrics, month: '2026-11' }));
    vi.advanceTimersByTime(30_000);
    expect(getAttentionMetrics).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.monthLabel()).toContain('noviembre');
    fixture.destroy(); vi.useRealTimers();
  });
});
