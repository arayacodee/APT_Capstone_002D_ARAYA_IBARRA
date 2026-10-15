import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AdminLogin } from './admin-login';
import { AuthService } from '../../core/services/auth.service';

describe('Ingreso de administración', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AdminLogin], providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([{ path: 'admin', children: [] }])] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('usa usuario y contraseña, restaura el rol y abre el panel', async () => {
    const fixture = TestBed.createComponent(AdminLogin); fixture.detectChanges();
    const login = fixture.componentInstance;
    expect(fixture.nativeElement.querySelector('input[type=password]')).toBeTruthy();
    login.email = 'superadmin@cronos'; login.password = 'test-password'; login.submit();
    const req = http.expectOne(request => request.url.endsWith('/api/auth/admin'));
    expect(req.request.body).toEqual({ email: 'superadmin@cronos', password: 'test-password' });
    req.flush({ user: { id: 'admin', email: login.email, name: 'Admin', role: 'SUPERADMIN' } });
    await fixture.whenStable();
    expect(TestBed.inject(AuthService).isSuperadmin()).toBe(true);
    expect(TestBed.inject(Router).url).toBe('/admin'); expect(login.password).toBe('');
  });
  it('muestra error sin iniciar una sesión ni conservar la contraseña', () => {
    const login = TestBed.createComponent(AdminLogin).componentInstance;
    login.email = 'superadmin@cronos'; login.password = 'incorrecta'; login.submit();
    http.expectOne(req => req.url.endsWith('/api/auth/admin')).flush({ error: 'Usuario o contraseña incorrectos.' }, { status: 401, statusText: 'Unauthorized' });
    expect(login.error()).toBe('Usuario o contraseña incorrectos.'); expect(login.password).toBe('');
    expect(TestBed.inject(AuthService).isLoggedIn()).toBe(false);
  });
});
