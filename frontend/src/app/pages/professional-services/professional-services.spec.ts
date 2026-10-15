import { TestBed } from '@angular/core/testing';
import { ProfessionalServices } from './professional-services';
import { testProviders } from '../../testing/test-providers';

describe('ProfessionalServices', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ProfessionalServices], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(ProfessionalServices);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
