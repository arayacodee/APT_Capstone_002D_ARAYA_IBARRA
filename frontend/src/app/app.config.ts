import {
  ApplicationConfig,
  inject,
  provideAppInitializer
} from '@angular/core';

import {
  provideHttpClient,
  withInterceptors
} from '@angular/common/http';

import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';

import { AuthService } from './core/services/auth.service';

import {
  credentialsInterceptor
} from './core/interceptors/credentials.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withInMemoryScrolling({
      scrollPositionRestoration: 'top',
      anchorScrolling: 'enabled'
    })),

    provideHttpClient(
      withInterceptors([
        credentialsInterceptor
      ])
    ),

    provideAppInitializer(() =>
      inject(AuthService).initialize()
    )
  ]
};
