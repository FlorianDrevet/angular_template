import { BrowserCacheLocation, InteractionType, IPublicClientApplication, PublicClientApplication } from '@azure/msal-browser';
import { MsalGuardConfiguration, MsalInterceptorConfiguration } from '@azure/msal-angular';

/**
 * Replace with your own Microsoft Entra ID app registration values
 * (https://entra.microsoft.com -> App registrations). These are read as
 * plain constants rather than from `APP_CONFIG` (runtime `/config.json`)
 * because MSAL needs them synchronously while building `app.config.ts`'s
 * providers, before any HTTP fetch could resolve — if you need them to vary
 * per environment without a rebuild, inline the values from `index.html`
 * (server-templated) or a small eagerly-fetched config file instead.
 */
const MSAL_CLIENT_ID = 'REPLACE_WITH_ENTRA_APPLICATION_CLIENT_ID';
const MSAL_TENANT_ID = 'REPLACE_WITH_ENTRA_TENANT_ID';
const MSAL_REDIRECT_URI = 'http://localhost:4200';

/**
 * MSAL is officially browser-only: `PublicClientApplication` reads `window`
 * and browser storage in its constructor, which throws during SSR. See
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/angular-universal.md
 * On the server we hand back a minimal, unused instance so the DI graph
 * still resolves; routes that need a signed-in user should use
 * `RenderMode.Client` in `app.routes.server.ts`.
 */
export function MSALInstanceFactory(): IPublicClientApplication {
  if (typeof window === 'undefined') {
    return new PublicClientApplication({ auth: { clientId: MSAL_CLIENT_ID } });
  }

  return new PublicClientApplication({
    auth: {
      clientId: MSAL_CLIENT_ID,
      authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
      redirectUri: MSAL_REDIRECT_URI,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: { scopes: ['user.read'] },
  };
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, string[] | null>();
  // Add your own API scopes here, e.g.:
  // protectedResourceMap.set(`${apiUrl}/*`, ['api://<api-client-id>/access_as_user']);
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/me', ['user.read']);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
