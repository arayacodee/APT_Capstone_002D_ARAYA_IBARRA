import { TestBed } from '@angular/core/testing';
import { Login } from './login';
import { testProviders } from '../../testing/test-providers';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('Login', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Login], providers: testProviders() }).compileComponents();
  });
  it('renderiza sin sesión y sin depender de servicios externos', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance).toBeTruthy();
  });
  it('permite elegir acceso o registro y solo el registro solicita datos personales', async () => {
    const fixture = TestBed.createComponent(Login);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    fixture.componentInstance.choose('login'); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('input[name="email"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[name="password"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('input[name="phone"]')).toBeNull();
    fixture.componentInstance.choose('register'); fixture.detectChanges();
    for (const name of ['firstName', 'lastName', 'email', 'password', 'phone', 'address']) expect(fixture.nativeElement.querySelector(`input[name="${name}"]`)).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('sin solicitar un código SMS');
  });
  it('abre el registro de empresas directamente y vuelve a empresas al crear la cuenta', async () => {
    TestBed.overrideProvider(ActivatedRoute, { useValue: { snapshot: { queryParamMap: convertToParamMap({ mode: 'register', returnUrl: '/companies' }) } } });
    const auth = TestBed.inject(AuthService);
    const user = { id: 'client', role: 'CLIENT' } as any;
    auth.register = () => of(user);
    const router = TestBed.inject(Router);
    let destination = '';
    router.navigateByUrl = ((url: string) => { destination = url; return Promise.resolve(true); }) as any;
    const fixture = TestBed.createComponent(Login); fixture.detectChanges();
    expect(fixture.componentInstance.mode()).toBe('register');
    expect(fixture.nativeElement.querySelector('.company-invitation')).toBeNull();
    fixture.componentInstance.submit();
    expect(destination).toBe('/companies');
  });
});
