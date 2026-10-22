import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { AccountProfile } from './account-profile';
import { ProfessionalProfile } from '../professional-profile/professional-profile';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { routes } from '../../app.routes';

describe('Perfil unificado de cuenta y negocio', () => {
  const contact = { firstName: 'Kidd', lastName: 'Sato', phone: '+56912345678', address: 'Santiago centro' };
  const business = { id: 'business', name: 'Estudio Cronos', category: 'BEAUTY', description: null, timezone: 'America/Santiago' };
  const user = signal({ id: 'owner', name: 'Kidd Sato', email: 'kidd@ejemplo.cl', role: 'PROFESSIONAL', ...contact });
  let updateContact: ReturnType<typeof vi.fn>;
  let api: { getMyBusiness: ReturnType<typeof vi.fn>; updateMyBusiness: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    user.set({ id: 'owner', name: 'Kidd Sato', email: 'kidd@ejemplo.cl', role: 'PROFESSIONAL', ...contact });
    updateContact = vi.fn().mockImplementation(data => {
      user.update(previous => ({ ...previous, ...data, name: `${data.firstName} ${data.lastName}` }));
      return of(user());
    });
    api = { getMyBusiness: vi.fn().mockReturnValue(of(business)), updateMyBusiness: vi.fn().mockReturnValue(of({ ...business, name: 'Nuevo negocio' })) };
    TestBed.configureTestingModule({ imports: [AccountProfile], providers: [
      provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
      { provide: ApiService, useValue: api },
      { provide: AuthService, useValue: { currentUser: user, isProfessional: () => user().role === 'PROFESSIONAL', updateContact } },
    ] });
  });

  it('reúne datos personales y editor de negocio con un solo contenido principal', () => {
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mi perfil');
    expect(fixture.nativeElement.textContent).toContain('Información personal');
    expect(fixture.nativeElement.textContent).toContain('Mi negocio');
    expect(fixture.nativeElement.querySelectorAll('main, [role="main"]').length).toBe(1);
    expect(fixture.nativeElement.querySelectorAll('h1').length).toBe(1);
    const editor = fixture.debugElement.query(By.directive(ProfessionalProfile)).componentInstance as ProfessionalProfile;
    editor.form.name = 'Nuevo negocio'; editor.saveProfile();
    expect(api.updateMyBusiness).toHaveBeenCalledWith(expect.objectContaining({ name: 'Nuevo negocio' }));
  });

  it('un cliente puede editar su cuenta sin consultar ni mostrar un negocio', () => {
    user.update(previous => ({ ...previous, role: 'CLIENT' }));
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-professional-profile')).toBeNull();
    expect(api.getMyBusiness).not.toHaveBeenCalled();
  });

  it('guardar actualiza el nombre de la cuenta y conserva la vista del negocio', () => {
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    fixture.componentInstance.form.controls.firstName.setValue('  Nuevo  ');
    fixture.componentInstance.save(); fixture.detectChanges();
    expect(updateContact).toHaveBeenCalledWith({ ...contact, firstName: 'Nuevo' });
    expect(fixture.nativeElement.querySelector('.profile-name').textContent).toContain('Nuevo Sato');
    expect(fixture.nativeElement.querySelector('app-professional-profile')).not.toBeNull();
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('valida datos vacíos o espacios antes de llamar a la API', () => {
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    fixture.componentInstance.form.controls.firstName.setValue('  ');
    fixture.componentInstance.save();
    expect(updateContact).not.toHaveBeenCalled();
    expect(fixture.componentInstance.error()).toContain('Revisa');
  });

  it('un fallo de guardado conserva los campos editados y permite reintentar', () => {
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    updateContact.mockReturnValueOnce(throwError(() => ({ error: { error: 'Sin conexión' } })));
    fixture.componentInstance.form.controls.phone.setValue('+56987654321');
    fixture.componentInstance.save();
    expect(fixture.componentInstance.error()).toBe('Sin conexión');
    expect(fixture.componentInstance.form.controls.phone.value).toBe('+56987654321');
    expect(fixture.componentInstance.form.enabled).toBe(true);
    expect(fixture.componentInstance.busy()).toBe(false);
  });

  it('mantiene el acceso anterior al editor dirigido al perfil unificado', () => {
    expect(routes.find(route => route.path === 'dashboard/profile')?.redirectTo).toBe('/account/profile');
  });

  it('un profesional sin negocio recibe un acceso a configurarlo', () => {
    api.getMyBusiness.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/professional/setup"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Crear mi negocio');
  });

  it('conserva Guardar y continuar hacia el destino de la reserva o empresa', () => {
    const route = TestBed.inject(ActivatedRoute);
    vi.spyOn(route.snapshot.queryParamMap, 'get').mockReturnValue('/companies');
    vi.spyOn(route.snapshot.queryParamMap, 'has').mockReturnValue(true);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Guardar y continuar');
    fixture.componentInstance.save(true);
    expect(navigate).toHaveBeenCalledWith('/companies');
  });

  it('rechaza redirecciones externas al continuar desde el perfil', () => {
    vi.spyOn(TestBed.inject(ActivatedRoute).snapshot.queryParamMap, 'get').mockReturnValue('https://externo.example');
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(AccountProfile); fixture.detectChanges();
    fixture.componentInstance.save(true);
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });
});
