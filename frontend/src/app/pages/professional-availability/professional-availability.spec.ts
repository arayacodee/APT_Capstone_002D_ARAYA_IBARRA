import { TestBed } from '@angular/core/testing';
import { ProfessionalAvailability } from './professional-availability';
import { testProviders } from '../../testing/test-providers';

describe('ProfessionalAvailability', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalAvailability], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(ProfessionalAvailability);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
