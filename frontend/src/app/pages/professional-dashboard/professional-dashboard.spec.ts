import { TestBed } from '@angular/core/testing';
import { ProfessionalDashboard } from './professional-dashboard';
import { testProviders } from '../../testing/test-providers';

describe('ProfessionalDashboard', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalDashboard], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(ProfessionalDashboard);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-attention-metrics')).toBeNull();
  });
});
