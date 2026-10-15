import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProfessionalProfile } from './professional-profile';
import { ApiService } from '../../core/services/api.service';

describe('Eliminar imágenes del perfil', () => {
  const business = { id: 'business', name: 'Negocio', avatarUrl: 'avatar.jpg', coverUrl: 'cover.jpg', description: null };
  let api: any;
  beforeEach(() => {
    api = {
      getMyBusiness: () => of(business),
      deleteBusinessAvatar: vi.fn(() => of({ ...business, avatarUrl: null, avatarPublicId: null })),
      deleteBusinessCover: vi.fn(() => of({ ...business, coverUrl: null, coverPublicId: null }))
    };
    TestBed.configureTestingModule({ imports: [ProfessionalProfile], providers: [provideRouter([]), { provide: ApiService, useValue: api }] });
  });
  it('permite dejar el perfil sin foto y muestra la inicial del negocio', () => {
    const fixture = TestBed.createComponent(ProfessionalProfile);
    fixture.detectChanges();
    fixture.componentInstance.removeImage('avatar');
    fixture.detectChanges();
    expect(api.deleteBusinessAvatar).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.querySelector('.avatar-preview img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.avatar-preview').textContent.trim()).toBe('N');
    fixture.destroy();
  });
  it('permite dejar el negocio sin portada', () => {
    const fixture = TestBed.createComponent(ProfessionalProfile);
    fixture.detectChanges();
    fixture.componentInstance.removeImage('cover');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.cover-preview img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.cover-placeholder')).not.toBeNull();
    fixture.destroy();
  });
  it('conserva la imagen y permite reintentar cuando falla la eliminación', () => {
    api.deleteBusinessAvatar.mockReturnValue(throwError(() => ({ error: { error: 'No disponible' } })));
    const fixture = TestBed.createComponent(ProfessionalProfile);
    fixture.detectChanges();
    fixture.componentInstance.removeImage('avatar');
    expect(fixture.componentInstance.business()?.avatarUrl).toBe('avatar.jpg');
    expect(fixture.componentInstance.errorMessage()).toBe('No disponible');
    expect(fixture.componentInstance.imageBusy()).toBe(false);
    fixture.destroy();
  });
});
