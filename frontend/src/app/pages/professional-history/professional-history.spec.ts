import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ProfessionalHistory } from './professional-history';

describe('Historial profesional', () => {
  const session = { id: 'session', notes: 'Nota inicial', amount: '15000', occurredAt: '2026-10-05T15:00:00Z', evidences: [] };
  let api: { getMyBusiness: ReturnType<typeof vi.fn>; getSessions: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    api = {
      getMyBusiness: vi.fn().mockReturnValue(of({ category: 'WELLNESS' })),
      getSessions: vi.fn().mockReturnValue(of({ items: [session], nextCursor: 'next' })),
    };
    TestBed.configureTestingModule({ imports: [ProfessionalHistory], providers: [provideRouter([]), { provide: ApiService, useValue: api }] });
  });
  it('muestra una tabla de consulta sin formularios dentro de las filas', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr').length).toBe(1);
    expect(fixture.nativeElement.querySelector('tbody textarea')).toBeNull();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('$15.000');
    expect(fixture.nativeElement.textContent).toContain('Historial de sesiones');
  });
  it('reemplaza la página, usa el cursor y permite regresar sin duplicados', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    api.getSessions.mockReturnValueOnce(of({ items: [{ ...session, id: 'second' }], nextCursor: null }));
    fixture.componentInstance.next();
    expect(api.getSessions).toHaveBeenLastCalledWith('next', 10);
    expect(fixture.componentInstance.sessions().map(item => item.id)).toEqual(['second']);
    expect(fixture.componentInstance.page()).toBe(1);
    fixture.componentInstance.previous();
    expect(api.getSessions).toHaveBeenLastCalledWith(undefined, 10);
    expect(fixture.componentInstance.sessions().map(item => item.id)).toEqual(['session']);
    expect(fixture.componentInstance.page()).toBe(0);
  });
  it('conserva la página actual si falla la siguiente y permite reintentar', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    api.getSessions.mockReturnValueOnce(throwError(() => ({ error: { error: 'No disponible' } })));
    fixture.componentInstance.next();
    expect(fixture.componentInstance.error()).toBe('No disponible');
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.componentInstance.sessions()[0].id).toBe('session');
  });
});
