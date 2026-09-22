import { Rule, Tree, apply, chain, mergeWith, MergeStrategy, move, noop, url } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { addProdDependency } from '../utils/add-dev-dependency';
import { addHttpInterceptor, insertRouteBeforeWildcard } from '../utils/insert-into-array';
import { versions } from '../utils/versions';
import { Schema } from './schema';

const MSAL_PROFILE_ROUTE = `  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [MsalGuard],
  },`;

const OIDC_PROFILE_ROUTE = `  {
    path: 'profile',
    loadComponent: () => import('./features/profile/profile').then((m) => m.Profile),
    canActivate: [autoLoginPartialRoutesGuard],
  },`;

function msalAuth(project: string): Rule {
  return chain([
    mergeWith(apply(url('./files/msal'), [move('/')]), MergeStrategy.Overwrite),
    addProdDependency('@azure/msal-angular', versions.msalAngular),
    addProdDependency('@azure/msal-browser', versions.msalBrowser),
    addRootProvider(project, ({ code, external }) => code`${external('provideMsalAuth', './core/auth/msal.providers')}()`),
    (tree: Tree) => {
      insertRouteBeforeWildcard(tree, MSAL_PROFILE_ROUTE, "import { MsalGuard } from '@azure/msal-angular';");
      return tree;
    },
  ]);
}

function oidcAuth(project: string): Rule {
  return chain([
    mergeWith(apply(url('./files/oidc'), [move('/')]), MergeStrategy.Overwrite),
    addProdDependency('angular-auth-oidc-client', versions.oidcClient),
    addRootProvider(project, ({ code, external }) => code`${external('provideOidcAuth', './core/auth/oidc.providers')}()`),
    (tree: Tree) => {
      addHttpInterceptor(tree, "import { authInterceptor } from 'angular-auth-oidc-client';", 'authInterceptor()');
      insertRouteBeforeWildcard(tree, OIDC_PROFILE_ROUTE, "import { autoLoginPartialRoutesGuard } from 'angular-auth-oidc-client';");
      return tree;
    },
  ]);
}

export default function auth(options: Schema): Rule {
  switch (options.provider) {
    case 'msal':
      if (options.ssr) {
        // Not a hard error: msal-config.ts already guards `PublicClientApplication`
        // construction for SSR, and the profile route can be moved to
        // `RenderMode.Client` in app.routes.server.ts. MSAL is simply not
        // officially supported under SSR — see msal-config.ts's comment.
        console.warn(
          '[auth] MSAL is not officially supported with SSR. The generated code guards against crashing, but review app.routes.server.ts.',
        );
      }
      return msalAuth(options.project);
    case 'oidc':
      return oidcAuth(options.project);
    case 'none':
    default:
      return noop();
  }
}
