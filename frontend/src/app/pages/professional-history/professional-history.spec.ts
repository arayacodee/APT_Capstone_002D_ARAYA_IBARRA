import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { ProfessionalHistory } from './professional-history';

describe('Historial profesional', () => {
  const session = { id: 'session', notes: 'Nota inicial', occurredAt: '2026-10-05T15:00:00Z', evidences: [] };
  let api: { getMyBusiness: ReturnType<typeof vi.fn>; getSessions: ReturnType<typeof vi.fn>; updateSession: ReturnType<typeof vi.fn>; addEvidence: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    api = {
      getMyBusiness: vi.fn().mockReturnValue(of({ category: 'WELLNESS' })),
      getSessions: vi.fn().mockReturnValue(of({ items: [session], nextCursor: 'next' })),
      updateSession: vi.fn().mockReturnValue(of({ ...session, notes: 'Nota editada' })),
      addEvidence: vi.fn()
    };
    TestBed.configureTestingModule({ imports: [ProfessionalHistory], providers: [provideRouter([]), { provide: ApiService, useValue: api }] });
  });
  it('carga el historial y guarda una nota sin perder las evidencias', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.sessions().length).toBe(1);
    component.notes['session'] = 'Nota editada';
    component.saveNotes(component.sessions()[0]);
    expect(api.updateSession).toHaveBeenCalledWith('session', 'Nota editada');
    expect(component.sessions()[0].notes).toBe('Nota editada');
    expect(component.sessions()[0].evidences).toEqual([]);
    fixture.destroy();
  });
  it('usa el cursor para agregar la siguiente página', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    api.getSessions.mockReturnValue(of({ items: [{ ...session, id: 'second' }], nextCursor: null }));
    fixture.componentInstance.load();
    expect(api.getSessions).toHaveBeenLastCalledWith('next');
    expect(fixture.componentInstance.sessions().length).toBe(2);
    fixture.destroy();
  });
  it('muestra un error y libera el formulario si falla el guardado', () => {
    const fixture = TestBed.createComponent(ProfessionalHistory);
    fixture.detectChanges();
    api.updateSession.mockReturnValue(throwError(() => ({ error: { error: 'No disponible' } })));
    fixture.componentInstance.saveNotes(fixture.componentInstance.sessions()[0]);
    expect(fixture.componentInstance.error()).toBe('No disponible');
    expect(fixture.componentInstance.busy()).toBe(false);
    expect(fixture.componentInstance.sessions()[0].notes).toBe('Nota inicial');
    fixture.destroy();
  });
});
