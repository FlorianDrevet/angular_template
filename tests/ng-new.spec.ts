import { describe, expect, it } from 'vitest';
import { dependencyVersion, generate, packageJson, path } from './helpers';
import type { NgNewOptions } from './helpers';

describe('ng-new (baseline, no options)', () => {
  const options: NgNewOptions = { name: 'demo-app' };

  it('generates the modernized shell and drops the CLI splash page', async () => {
    const tree = await generate(options);

    for (const file of [
      'angular.json',
      'package.json',
      'eslint.config.js',
      '.husky/pre-commit',
      'public/config.json',
      'src/app/app.ts',
      'src/app/app.config.ts',
      'src/app/app.routes.ts',
      'src/app/core/config/app-config.token.ts',
      'src/app/core/config/provide-app-config.ts',
      'src/app/core/http/interceptors.ts',
      'src/app/core/layout/shell.ts',
      'src/app/features/home/home.ts',
      'src/app/features/not-found/not-found.ts',
      'src/scss/_tokens.scss',
    ]) {
      expect(tree.files, `expected ${file} to exist`).toContain(path(options, file));
    }

    expect(tree.readContent(path(options, 'src/app/app.html'))).not.toContain('angular-logo');
  });

  it('wires zoneless change detection, the router and HttpClient in app.config.ts', async () => {
    const tree = await generate(options);
    const appConfig = tree.readContent(path(options, 'src/app/app.config.ts'));

    expect(appConfig).toContain('provideZonelessChangeDetection()');
    expect(appConfig).toContain('provideRouter(routes');
    expect(appConfig).toContain('provideHttpClient(withInterceptors(httpInterceptors))');
    expect(appConfig).toContain('provideAppConfig()');
  });

  it('does not add any optional feature dependency', async () => {
    const tree = await generate(options);
    const pkg = packageJson(tree, options) as { dependencies?: Record<string, string> };

    expect(pkg.dependencies?.['@azure/msal-angular']).toBeUndefined();
    expect(pkg.dependencies?.['angular-auth-oidc-client']).toBeUndefined();
    expect(pkg.dependencies?.['@angular/material']).toBeUndefined();
    expect(pkg.dependencies?.['@jsverse/transloco']).toBeUndefined();
  });

  it('adds the quality tooling every project gets', async () => {
    const tree = await generate(options);

    expect(dependencyVersion(tree, options, 'angular-eslint')).toBeDefined();
    expect(dependencyVersion(tree, options, 'husky')).toBeDefined();
    expect(dependencyVersion(tree, options, 'lint-staged')).toBeDefined();
  });
});

describe('ng-new (ssr + material + msal + i18n + docker + ci)', () => {
  const options: NgNewOptions = {
    name: 'full-app',
    ssr: true,
    ui: 'material',
    auth: 'msal',
    i18n: true,
    docker: true,
    ci: true,
  };

  it('generates every opted-in feature', async () => {
    const tree = await generate(options);

    expect(dependencyVersion(tree, options, '@angular/material')).toBeDefined();
    expect(dependencyVersion(tree, options, '@angular/cdk')).toBeDefined();
    expect(dependencyVersion(tree, options, '@azure/msal-angular')).toBeDefined();
    expect(dependencyVersion(tree, options, '@azure/msal-browser')).toBeDefined();
    expect(dependencyVersion(tree, options, '@jsverse/transloco')).toBeDefined();

    expect(tree.files).toContain(path(options, 'src/app/core/auth/msal.providers.ts'));
    expect(tree.files).toContain(path(options, 'src/app/core/auth/msal-config.ts'));
    expect(tree.files).toContain(path(options, 'src/app/features/profile/profile.ts'));
    expect(tree.files).toContain(path(options, 'src/app/core/i18n/provide-i18n.ts'));
    expect(tree.files).toContain(path(options, 'public/i18n/en.json'));
    expect(tree.files).toContain(path(options, 'public/i18n/fr.json'));
    expect(tree.files).toContain(path(options, 'Dockerfile'));
    expect(tree.files).toContain(path(options, '.github/workflows/ci.yml'));
    expect(tree.files).toContain(path(options, 'src/app/app.routes.server.ts'));
  });

  it('registers provideMsalAuth() and provideI18n() as root providers', async () => {
    const tree = await generate(options);
    const appConfig = tree.readContent(path(options, 'src/app/app.config.ts'));

    expect(appConfig).toContain('provideMsalAuth()');
    expect(appConfig).toContain("from './core/auth/msal.providers'");
    expect(appConfig).toContain('provideI18n()');
    expect(appConfig).toContain("from './core/i18n/provide-i18n'");
  });

  it('adds the profile route guarded by MsalGuard, before the wildcard', async () => {
    const tree = await generate(options);
    const routes = tree.readContent(path(options, 'src/app/app.routes.ts'));

    expect(routes).toContain("path: 'profile'");
    expect(routes).toContain('canActivate: [MsalGuard]');
    expect(routes.indexOf("path: 'profile'")).toBeLessThan(routes.indexOf("path: '**'"));
  });

  it('SSR Dockerfile runs the Node server, not nginx', async () => {
    const tree = await generate(options);
    const dockerfile = tree.readContent(path(options, 'Dockerfile'));

    expect(dockerfile).toContain('server/server.mjs');
    expect(dockerfile).not.toContain('nginx');
  });

  it('sets the SSR catch-all route to server rendering', async () => {
    const tree = await generate(options);
    expect(tree.readContent(path(options, 'src/app/app.routes.server.ts'))).toContain('RenderMode.Server');
  });
});

describe('ng-new (tailwind + oidc)', () => {
  const options: NgNewOptions = { name: 'oidc-app', ui: 'tailwind', auth: 'oidc', docker: true };

  it('sets up Tailwind via the official style option and adds the auth interceptor', async () => {
    const tree = await generate(options);

    expect(dependencyVersion(tree, options, 'tailwindcss')).toBeDefined();
    expect(dependencyVersion(tree, options, 'angular-auth-oidc-client')).toBeDefined();

    const interceptors = tree.readContent(path(options, 'src/app/core/http/interceptors.ts'));
    expect(interceptors).toContain('authInterceptor()');

    const routes = tree.readContent(path(options, 'src/app/app.routes.ts'));
    expect(routes).toContain('canActivate: [autoLoginPartialRoutesGuard]');
  });

  it('generates the SPA Dockerfile (nginx) since SSR is off', async () => {
    const tree = await generate(options);
    const dockerfile = tree.readContent(path(options, 'Dockerfile'));

    expect(dockerfile).toContain('nginx');
    expect(tree.files).toContain(path(options, 'docker/nginx.conf'));
    expect(tree.files).toContain(path(options, 'docker/docker-entrypoint.sh'));
  });
});
