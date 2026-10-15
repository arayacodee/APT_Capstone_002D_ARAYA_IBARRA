import { TestBed } from '@angular/core/testing';
import { Booking } from './booking';
import { testProviders } from '../../testing/test-providers';

describe('Booking', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Booking], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(Booking);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
