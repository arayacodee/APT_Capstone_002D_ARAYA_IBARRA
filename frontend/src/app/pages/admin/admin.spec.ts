import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Admin } from './admin';

describe('Administración', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [Admin], providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('solicita confirmación sin borrar y solo envía DELETE al confirmar', () => {
    const fixture = TestBed.createComponent(Admin);
    const admin = fixture.componentInstance;
    const user = { id: 'client', name: 'Cliente', role: 'CLIENT' };
    http.expectOne(req => req.method === 'GET').flush({ items: [user], hasMore: false });
    fixture.detectChanges();
    const deleteButton = fixture.nativeElement.querySelector('button.danger') as HTMLButtonElement;
    deleteButton.click(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Esta eliminación es permanente');
    http.expectNone(req => req.method === 'DELETE');
    admin.confirmDeletion();
    const deletion = http.expectOne(req => req.method === 'DELETE');
    expect(deletion.request.url).toContain('/admin/users/client');
    expect(deletion.request.body).toEqual({ confirm: true });
    deletion.flush({ message: 'Registro eliminado.', warning: null });
    http.expectOne(req => req.method === 'GET').flush({ items: [], hasMore: false });
    expect(admin.deleting()).toBe(null);
  });
  it('protege el superadmin y permite cancelar una eliminación', () => {
    const fixture = TestBed.createComponent(Admin);
    const admin = fixture.componentInstance;
    const user = { id: 'admin', name: 'Admin', role: 'SUPERADMIN' };
    http.expectOne(req => req.method === 'GET').flush({ items: [user], hasMore: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button.danger')).toBe(null);
    admin.requestDeletion(user); expect(admin.deleting()).toBe(null);
    admin.requestDeletion({ id: 'client', role: 'CLIENT' }); admin.deleting.set(null); admin.confirmDeletion();
    http.expectNone(req => req.method === 'DELETE');
  });
  it('carga usuarios y edita nombre sin reenviar el rol protegido del superadmin', () => {
    const fixture = TestBed.createComponent(Admin);
    const admin = fixture.componentInstance;
    const user = { id: 'founder', name: 'Martín', email: 'founder@example.com', role: 'SUPERADMIN' };
    http.expectOne(request => request.url.endsWith('/admin/users')).flush({ items: [user], hasMore: false });
    fixture.detectChanges();
    admin.edit(user); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('rol protegido');
    admin.draft['name'] = 'Martín Ibarra'; admin.save();
    const request = http.expectOne(req => req.method === 'PATCH');
    expect(request.request.body).toEqual({ name: 'Martín Ibarra' });
    request.flush(user);
    http.expectOne(req => req.method === 'GET').flush({ items: [user], hasMore: false });
    expect(admin.message()).toBe('Cambios guardados.');
  });
  it('muestra errores del servidor al guardar', () => {
    const fixture = TestBed.createComponent(Admin);
    const admin = fixture.componentInstance;
    http.expectOne(req => req.method === 'GET').flush({ items: [], hasMore: false });
    admin.newUser(); admin.save();
    http.expectOne(req => req.method === 'POST').flush({ error: 'El correo ya está registrado.' }, { status: 409, statusText: 'Conflict' });
    expect(admin.error()).toBe('El correo ya está registrado.');
    expect(admin.creating()).toBe(true);
    expect(admin.saving()).toBe(false);
  });
});
