/**
 * Pinned versions for every dependency the template's feature schematics can
 * add to a generated project. Centralized here so bumping a library for a
 * new template release means touching one file. Angular's own packages are
 * NOT listed: they come from `@schematics/angular`'s `ng-new`, which always
 * resolves the Angular version matching the installed `@angular/cli`.
 */
export const versions = {
  angularEslint: '^22.5.0',
  typescriptEslint: '^8.70.1',
  eslintJs: '^9.38.0',
  eslint: '^10.11.0',
  eslintConfigPrettier: '^10.1.8',
  prettier: '^3.9.8',
  husky: '^9.1.7',
  lintStaged: '^17.5.1',
  angularMaterial: '^22.1.7',
  tailwindcss: '^4.3.3',
  postcss: '^8.5.6',
  msalAngular: '^6.2.1',
  msalBrowser: '^5.22.0',
  oidcClient: '^22.0.1',
  transloco: '^8.4.0',
} as const;
