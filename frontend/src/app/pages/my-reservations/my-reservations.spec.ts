import { TestBed } from '@angular/core/testing';
import { MyReservations } from './my-reservations';
import { testProviders } from '../../testing/test-providers';

describe('MyReservations', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MyReservations], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(MyReservations);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
});
