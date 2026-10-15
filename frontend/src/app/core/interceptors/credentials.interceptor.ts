import {
  HttpInterceptorFn
} from '@angular/common/http';

import { environment } from '../../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (
  request,
  next
) => {
  const apiUrl = environment.apiUrl.replace(/\/$/, '');
  if (request.url === apiUrl || request.url.startsWith(`${apiUrl}/`)) {
    request = request.clone({
      withCredentials: true
    });
  }

  return next(request);
};
