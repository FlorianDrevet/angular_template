/**
 * Pinned versions for every dependency the template's feature schematics can
 * add to a generated project. Centralized here so bumping a library for a
 * new template release means touching one file. Angular's own packages are
 * NOT listed: they come from `@schematics/angular`'s `ng-new`, which always
 * resolves the Angular version matching the installed `@angular/cli`.
 */
export const versions = {
  angularEslint: '^22.6.0',
  typescriptEslint: '^8.72.2',
  eslintJs: '^10.0.1',
  eslint: '^10.14.0',
  eslintConfigPrettier: '^10.1.8',
  prettier: '^3.10.1',
  husky: '^9.1.7',
  lintStaged: '^17.6.0',
  angularMaterial: '^22.2.7',
  tailwindcss: '^4.3.5',
  postcss: '^8.5.32',
  msalAngular: '^6.3.2',
  msalBrowser: '^5.29.1',
  oidcClient: '^22.0.2',
  transloco: '^8.4.0',
} as const;
