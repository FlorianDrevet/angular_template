import { apply, applyTemplates, chain, mergeWith, MergeStrategy, move, Rule, Tree, url } from '@angular-devkit/schematics';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { addDevDependency } from '../utils/add-dev-dependency';
import { versions } from '../utils/versions';
import { Schema } from './schema';

const APP_CONFIG_TS = `import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideAppConfig } from './core/config/provide-app-config';
import { httpInterceptors } from './core/http/interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors(httpInterceptors)),
    provideAppConfig(),
  ],
};
`;

const APP_ROUTES_TS = `import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
`;

const APP_TS = `import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Shell } from './core/layout/shell';

@Component({
  selector: 'app-root',
  imports: [Shell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
`;

const APP_HTML = `<app-shell />\n`;

const APP_SCSS = `:host {\n  display: block;\n}\n`;

const APP_SPEC_TS = `import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    // Shell uses RouterLink/RouterLinkActive, which need a router in DI —
    // an empty route table is enough for this smoke test.
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
`;

const STYLES_SCSS = `@use './scss/tokens';

* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family:
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    sans-serif;
  color: var(--color-text);
  background-color: var(--color-background);
}
`;

const SERVER_ROUTES_TS = `import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Routes gated behind client-only concerns (e.g. an auth guard reading
  // browser storage) should opt into RenderMode.Client instead of Server.
  {
    path: '**',
    renderMode: RenderMode.Server,
  },
];
`;

export default function base(options: Schema): Rule {
  {
    // `eslint.config.js` ships as `eslint.config.js.template` in this
    // source tree (not the real name): ESLint's flat-config auto-discovery
    // walks up from any linted file to the nearest `eslint.config.js`, and
    // since that file requires `angular-eslint` (a dependency of generated
    // projects, not of this package), a literally-named copy inside `src/`
    // would break linting this repo's own source. `applyTemplates({})`
    // strips the `.template` suffix on output; it's a no-op on every other
    // file here, none of which use EJS syntax.
    const newFiles = mergeWith(apply(url('./files/base'), [applyTemplates({}), move('/')]), MergeStrategy.Overwrite);

    const rewriteGeneratedFiles: Rule = (host: Tree) => {
      host.overwrite('/src/app/app.config.ts', APP_CONFIG_TS);
      host.overwrite('/src/app/app.routes.ts', APP_ROUTES_TS);
      host.overwrite('/src/app/app.ts', APP_TS);
      host.overwrite('/src/app/app.html', APP_HTML);
      host.overwrite('/src/app/app.scss', APP_SCSS);
      host.overwrite('/src/app/app.spec.ts', APP_SPEC_TS);
      host.overwrite('/src/styles.scss', STYLES_SCSS);
      if (options.ssr && host.exists('/src/app/app.routes.server.ts')) {
        host.overwrite('/src/app/app.routes.server.ts', SERVER_ROUTES_TS);
      }
      return host;
    };

    const addScripts: Rule = (host: Tree) => {
      const packageJson = new JSONFile(host, '/package.json');
      packageJson.modify(['scripts', 'lint'], 'eslint .');
      packageJson.modify(['scripts', 'format'], 'prettier --write .');
      packageJson.modify(['scripts', 'format:check'], 'prettier --check .');
      packageJson.modify(['scripts', 'prepare'], 'husky');
      packageJson.modify(
        ['lint-staged'],
        {
          '*.ts': ['eslint --fix'],
          '*.{ts,html,scss,json,md}': ['prettier --write'],
        },
        false,
      );
      return host;
    };

    return chain([
      newFiles,
      rewriteGeneratedFiles,
      addDevDependency('eslint', versions.eslint),
      addDevDependency('@eslint/js', versions.eslintJs),
      addDevDependency('typescript-eslint', versions.typescriptEslint),
      addDevDependency('angular-eslint', versions.angularEslint),
      addDevDependency('husky', versions.husky),
      addDevDependency('lint-staged', versions.lintStaged),
      addScripts,
    ]);
  }
}
