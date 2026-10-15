import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';
import { credentialsInterceptor } from '../interceptors/credentials.interceptor';

describe('ApiService', () => {
  let http: HttpTestingController;
  let api: ApiService;
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(withInterceptors([credentialsInterceptor])), provideHttpClientTesting()] });
    api = TestBed.inject(ApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('usa la URL configurada y envía la cookie de sesión', () => {
    api.getMyReservations().subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/reservations`);
    expect(req.request.withCredentials).toBe(true);
    req.flush([]);
  });
  it('envía evidencias como multipart sin fijar Content-Type', () => {
    api.addEvidence('session', new File(['image'], 'image.png', { type: 'image/png' }), 'Resultado').subscribe();
    const req = http.expectOne(`${environment.apiUrl}/api/sessions/session/evidences`);
    expect(req.request.body.get('caption')).toBe('Resultado');
    expect(req.request.headers.has('Content-Type')).toBe(false);
    req.flush({ id: 'evidence' });
  });
});
