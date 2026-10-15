import { TestBed } from '@angular/core/testing';
import { ProfessionalProfile } from './professional-profile';
import { testProviders } from '../../testing/test-providers';

describe('ProfessionalProfile', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalProfile], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(ProfessionalProfile);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
