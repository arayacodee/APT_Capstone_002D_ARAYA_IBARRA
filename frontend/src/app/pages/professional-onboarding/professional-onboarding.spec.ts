import { TestBed } from '@angular/core/testing';
import { ProfessionalOnboarding } from './professional-onboarding';
import { testProviders } from '../../testing/test-providers';

describe('ProfessionalOnboarding', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalOnboarding], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(ProfessionalOnboarding);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
