# @floriandrevet/ng-template

A configurable Angular 22 project generator, built as an [Angular Schematics](https://angular.dev/tools/cli/schematics) collection — the same mechanism `ng new`, `ng generate` and `ng add` use. Not a snapshot of files to copy-paste: `ng new` wraps Angular's own official generator and layers a modernized application shell plus opt-in features on top, so it stays current as Angular evolves.

```bash
npx -p @angular/cli@22 -p @floriandrevet/ng-template ng new my-app --collection=@floriandrevet/ng-template
```

You'll be prompted for each option below (or pass them as flags to skip the prompts).

## Options

| Flag       | Values                         | Default | What it does                                                                                                                                                                                                                                |
| ---------- | ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--ssr`    | `true` / `false`               | `false` | Server-Side Rendering + Static Site Generation (Angular's own `ssr` option).                                                                                                                                                                |
| `--ui`     | `none`, `material`, `tailwind` | `none`  | UI library. `material` sets up an M3 theme (`mat.theme()`) and fonts; `tailwind` uses Angular's own built-in Tailwind v4 integration; `none` ships a small set of CSS design tokens instead.                                                |
| `--auth`   | `none`, `msal`, `oidc`         | `none`  | Authentication. `msal` is Microsoft Entra ID via `@azure/msal-angular`; `oidc` is a generic OpenID Connect provider (Keycloak, Auth0, Entra in OIDC mode, ...) via `angular-auth-oidc-client`. Both add a guarded example `/profile` route. |
| `--i18n`   | `true` / `false`               | `false` | Runtime internationalization with [Transloco](https://jsverse.github.io/transloco/), `en`/`fr` seeded.                                                                                                                                      |
| `--docker` | `true` / `false`               | `false` | A multi-stage `Dockerfile` — nginx + a runtime `config.json` entrypoint without SSR, a Node server with SSR.                                                                                                                                |
| `--ci`     | `true` / `false`               | `true`  | A GitHub Actions workflow: lint → test → build.                                                                                                                                                                                             |

## What the generated app looks like

- **Standalone, zoneless, OnPush** everywhere — no NgModules, no `zone.js`, `provideZonelessChangeDetection()`. Vitest is the test runner (Angular's own default since v21).
- **Runtime configuration**, not build-time `environments/`: `public/config.json` is fetched once at startup (`provideAppConfig()`) and exposed through an `APP_CONFIG` token, so the same build artifact can deploy to every environment. The `docker` option regenerates it from environment variables on container start.
- **`HttpClient`** (fetch-based by default in Angular 22) with two interceptors (`core/http/interceptors.ts`): one prefixes relative URLs with `APP_CONFIG.apiUrl`, the other centralizes error logging. Feature schematics (e.g. `oidc`'s `authInterceptor()`) append to that same array.
- **Quality tooling out of the box**: `angular-eslint` + `typescript-eslint` (typed linting, `recommendedTypeChecked`), Prettier (including the Angular HTML parser), Husky + lint-staged running both on commit.

## Adding a feature to an existing project

Every feature is also its own schematic, so you can run it later:

```bash
ng generate @floriandrevet/ng-template:ui --kind=material
ng generate @floriandrevet/ng-template:auth --provider=oidc
ng generate @floriandrevet/ng-template:i18n
ng generate @floriandrevet/ng-template:docker
ng generate @floriandrevet/ng-template:ci
```

## Why Schematics, not a template repo?

Angular's Schematics are the closest thing to `dotnet new` templates with options — and unlike a plain file snapshot, they compose with Angular's own generators rather than fork them:

- `ng-new` calls the official `workspace` and `application` schematics from `@schematics/angular`, so every new Angular release's defaults arrive here almost for free.
- `app.config.ts` edits (adding a provider for auth/i18n) go through the official `addRootProvider`/`addRootImport` AST-aware helpers, not regex surgery.
- `ng generate @floriandrevet/ng-template:<feature>` adds a feature to a project that already exists.
- `ng update @floriandrevet/ng-template` can replay migrations on projects generated by an older version of this template (see `src/migrations.json`).

See `docs/superpowers/specs/2026-09-22-ng-template-schematics-design.md` for the full design rationale.

## Developing this package

```bash
npm install
npm run build     # tsc + copy schema.json / files/ template trees into dist/
npm run lint
npm test           # builds first (pretest), then runs the Vitest schematic tests
```

### Testing a change end-to-end

```bash
npm run build
npm pack
npx -p @angular/cli@22 -p ./floriandrevet-ng-template-*.tgz ng new demo --collection=@floriandrevet/ng-template
cd demo && npm run lint && npm test -- --watch=false && npm run build
```

## Installing from GitHub Packages

```bash
echo "@floriandrevet:registry=https://npm.pkg.github.com" >> .npmrc
npm install -g @angular/cli@22 @floriandrevet/ng-template
```

## Versioning and upgrades

The package version tracks the Angular major it targets (`22.x.y`). When Angular ships a new major, this template gets a matching major release; existing projects upgrade Angular itself with `ng update @angular/core`, and pick up this template's own migrations (if any) with `ng update @floriandrevet/ng-template`.
