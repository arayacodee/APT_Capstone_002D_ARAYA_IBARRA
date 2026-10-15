import { TestBed } from '@angular/core/testing';
import { Business } from './business';
import { testProviders } from '../../testing/test-providers';
import { ApiService } from '../../core/services/api.service';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';

describe('Business', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Business], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(Business);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
  it('presenta terapias, terapeuta y ubicación sin mostrar un portafolio de trabajos', () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { paramMap: convertToParamMap({ id: 'wellness' }) } } });
    TestBed.overrideProvider(ApiService, { useValue: {
      getBusinessById: () => of({ id: 'wellness', name: 'Centro de bienestar', category: 'WELLNESS', professionalName: 'Ana', specialties: 'Reiki', attentionMode: 'ONSITE', address: 'Santiago', description: 'Atención personalizada' }),
      getServicesByBusiness: () => of([{ id: 'therapy', name: 'Sesión de reiki', durationMin: 60, price: 25000, isActive: true }])
    } });
    const fixture = TestBed.createComponent(Business); fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Terapeuta'); expect(text).toContain('Ana'); expect(text).toContain('Terapias'); expect(text).toContain('Reservar cita'); expect(text).toContain('Presencial'); expect(text).toContain('Santiago');
    expect(fixture.nativeElement.querySelector('.portfolio-section')).toBeNull();
  });
});
