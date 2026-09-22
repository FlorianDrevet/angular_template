import { EnvironmentProviders } from '@angular/core';
import { LogLevel, provideAuth, withAppInitializerAuthCheck } from 'angular-auth-oidc-client';

/**
 * Replace `authority`/`clientId` with your OIDC provider's values (Keycloak
 * realm URL, Auth0 domain, Entra ID `/v2.0` authority, ...).
 * `withAppInitializerAuthCheck()` runs the auth check before the app
 * renders, so route guards and `authenticated()` are correct on first
 * paint; the underlying `authInterceptor()` is registered separately in
 * `core/http/interceptors.ts` (see the `auth` schematic).
 */
export function provideOidcAuth(): EnvironmentProviders {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200';

  return provideAuth(
    {
      config: {
        authority: 'REPLACE_WITH_OIDC_AUTHORITY',
        clientId: 'REPLACE_WITH_OIDC_CLIENT_ID',
        redirectUrl: origin,
        postLogoutRedirectUri: origin,
        responseType: 'code',
        scope: 'openid profile email offline_access',
        silentRenew: true,
        useRefreshToken: true,
        logLevel: LogLevel.Warn,
      },
    },
    withAppInitializerAuthCheck(),
  );
}
