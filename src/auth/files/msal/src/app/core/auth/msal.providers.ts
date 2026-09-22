import { EnvironmentProviders, importProvidersFrom, inject, makeEnvironmentProviders, provideAppInitializer } from '@angular/core';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { MsalInterceptor, MsalModule, MsalService } from '@azure/msal-angular';
import { firstValueFrom, switchMap } from 'rxjs';
import { MSALGuardConfigFactory, MSALInstanceFactory, MSALInterceptorConfigFactory } from './msal-config';

/**
 * Wires up Microsoft Entra ID authentication via `@azure/msal-angular`.
 * Bridges the library's NgModule-based `MsalModule.forRoot(...)` into a
 * standalone `ApplicationConfig` with `importProvidersFrom`, registers
 * `MsalInterceptor` (attaches access tokens to matching requests, see
 * `MSALInterceptorConfigFactory`), and processes the redirect response
 * before the app renders.
 */
export function provideMsalAuth(): EnvironmentProviders {
  return makeEnvironmentProviders([
    importProvidersFrom(MsalModule.forRoot(MSALInstanceFactory(), MSALGuardConfigFactory(), MSALInterceptorConfigFactory())),
    { provide: HTTP_INTERCEPTORS, useClass: MsalInterceptor, multi: true },
    provideAppInitializer(() => {
      if (typeof window === 'undefined') {
        // MSAL is browser-only; see msal-config.ts.
        return undefined;
      }
      const msal = inject(MsalService);
      return firstValueFrom(msal.initialize().pipe(switchMap(() => msal.handleRedirectObservable())));
    }),
  ]);
}
