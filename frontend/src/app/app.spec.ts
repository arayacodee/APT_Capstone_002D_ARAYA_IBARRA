import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { testProviders } from './testing/test-providers';
import { AuthService } from './core/services/auth.service';
import { signal } from '@angular/core';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
  it('muestra Resumen para profesionales y lo dirige al historial', () => {
    TestBed.overrideProvider(AuthService, { useValue: {
      currentUser: signal({ name: 'Profesional' }), isProfessional: () => true,
      isClient: () => false, isSuperadmin: () => false,
    } });
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('nav a[href="/dashboard/history"]');
    expect(summary?.textContent.trim()).toBe('Resumen');
  });
  it('oculta Resumen cuando no hay sesión profesional', () => {
    const fixture = TestBed.createComponent(App); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('nav a[href="/dashboard/history"]')).toBeNull();
  });
});
