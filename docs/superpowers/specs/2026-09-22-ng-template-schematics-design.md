# Design : `@floriandrevet/ng-template` — générateur de projets Angular configurable

Date : 2026-09-22

## Problème

Le repo `angular_template` était une app Angular 19 à copier-coller à la main pour démarrer un nouveau projet. Elle contenait :

- de l'auth JWT maison avec Axios global, un token stocké dans un cookie lisible en JS, et une boucle de logout au démarrage (`_isTokenValid` → `logout()` → `navigate('/login')` alors qu'aucune route `/login` n'existe) ;
- Karma configuré sans le moindre test, pas de linter, pas de formatter ;
- une config Tailwind qui écrase la palette par défaut (`colors: {}` / `fontFamily: {}` hors `extend`) ;
- un ID Microsoft Clarity et un UUID d'analytics CLI committés en dur.

Objectif : un mécanisme de génération avec options (à la `dotnet new`), qui reste à jour avec les nouvelles versions d'Angular, et un socle applicatif modernisé.

## Mécanisme choisi : Angular Schematics

Angular a un équivalent natif à un moteur de templates avec options : les **Schematics** (`@angular-devkit/schematics`), déjà utilisées par `ng new`, `ng generate` et `ng add`.

- `ng new mon-app --collection=@floriandrevet/ng-template` exécute notre schematic `ng-new`, qui enveloppe le `ng-new` officiel (`externalSchematic('@schematics/angular', 'ng-new', …)`) puis enchaîne nos propres règles.
- Les options se déclarent dans un `schema.json` avec `x-prompt`, y compris des listes et du multi-select — pas besoin d'écrire l'UI des prompts.
- `ng generate @floriandrevet/ng-template:<feature>` permet d'ajouter une feature après coup sur un projet existant.
- `ng update @floriandrevet/ng-template` permet de rejouer des migrations sur les projets déjà générés (`ng-update.migrations` dans `package.json`).

**Pourquoi pas les alternatives ?**

- Nx (preset) : apporte tout un écosystème monorepo non nécessaire pour un template mono-app.
- `create-*` npm / degit / Yeoman : pas de mécanisme d'upgrade des projets déjà générés.
- `dotnet new` (snapshot de fichiers avec `#if`) : demande de re-synchroniser le squelette à la main à chaque montée de version d'Angular ; aucune AST awareness.

**Manipulation de code.** En inspectant `@schematics/angular@22.1.8/utility`, l'équipe Angular exporte des helpers officiels réutilisés par `ng add` (Material, etc.) :

- `addRootProvider(projectName, ({code, external}) => …)` et `addRootImport(...)` : insertion AST-aware dans `app.config.ts`, avec gestion automatique des imports.
- `addDependency(name, specifier, {type})` : édition de `package.json`, avec tâche d'installation automatique.
- `readWorkspace` / `updateWorkspace` : édition typée de `angular.json`, en conservant le formatage.
- `JSONFile` : édition ciblée par JSON-path pour les autres fichiers JSON (`tsconfig*.json`, config ESLint JSON, etc.).

Ces helpers évitent d'écrire un codemod maison fragile : chaque feature schematic (`ui`, `auth`, `i18n`, `docker`, `ci`) les réutilise.

## Vérifications faites sur la CLI Angular 22.1.8 (source de vérité : package npm réel, pas la doc)

- `ng-new` (schema officiel) : `fileNameStyleGuide` vaut `2025` par défaut → fichiers `app.ts`/`app.html`/`app.css` (plus de suffixe `.component`). `zoneless` n'a pas de défaut explicite (à passer nous-mêmes). `testRunner` vaut `vitest` par défaut.
- Le `app.config.ts` généré n'a **plus** `provideZoneChangeDetection` quand `zoneless: true`, et contient toujours `provideBrowserGlobalErrorListeners()`.
- Le `package.json` généré n'a plus `zone.js` ni `platform-browser-dynamic` en dépendance, et inclut déjà **Prettier** par défaut.
- `angular.json` généré n'a plus d'UUID d'analytics CLI par défaut (ce problème du repo actuel est donc déjà résolu côté CLI officielle).

Ces constats évitent de dupliquer un travail que la CLI officielle fait déjà, et cadrent le contenu réel de `base/files`.

## Architecture du package

```
package.json               name: @floriandrevet/ng-template, "schematics": "./dist/collection.json",
                            "ng-update": { "migrations": "./dist/migrations.json" }
src/
  collection.json           déclare ng-new, base, ui, auth, i18n, docker, ci
  migrations.json           vide au départ
  utils/versions.ts         versions pinnées des dépendances ajoutées par le template
  ng-new/                   index.ts (wrap ng-new officiel + chaîne des features), schema.json, schema.d.ts
  base/                     socle Angular 22 moderne (voir plus bas), schema.json, schema.d.ts
  ui/                       --kind=material|tailwind|none
  auth/                     --provider=none|msal|oidc
  i18n/                     Transloco (bool)
  docker/                   Dockerfile + nginx.conf + entrypoint runtime-config (bool)
  ci/                       .github/workflows/ci.yml pour le projet généré (bool)
tests/                      SchematicTestRunner + Vitest, un fichier de test par schematic
.github/workflows/          ci.yml (tests unitaires du package) et publish.yml (GitHub Packages sur tag v*)
```

## Socle `base`

- Composants standalone uniquement, `inject()`, `input()`/`output()`, `@if`/`@for`, `OnPush` par défaut.
- `app.config.ts` : `provideZonelessChangeDetection()`, `provideRouter(routes, withComponentInputBinding(), withViewTransitions())`, `provideHttpClient(withInterceptors([...]))`.
- Config runtime via `public/config.json` chargé par `provideAppInitializer`, exposé par un token `APP_CONFIG` typé — remplace les `environments/` pour permettre « build once, deploy anywhere ».
- `HttpClient` (fetch par défaut en v22) remplace Axios ; suppression d'`axios`, `ngx-cookie-service`, `@auth0/angular-jwt`.
- Qualité : angular-eslint, Prettier (déjà fourni par `ng-new`), husky + lint-staged, un test Vitest d'exemple.
- Nettoyage : suppression de Clarity, du `lang="fr"` en dur, du `calc(100vh - 120px)`.

## Features optionnelles

- **`ui`** : `material` (`ng add @angular/material`, thème M3 `mat.theme()`), `tailwind` (v4, `@import "tailwindcss"`, palette par défaut conservée), `none` (custom properties CSS).
- **`auth=msal`** : `@azure/msal-angular` v6 (nécessite Angular ≥22), standalone, config lue depuis `config.json`, état exposé en signaux (compatible zoneless). Non compatible SSR (limitation officielle documentée) : routes protégées forcées en rendu client si SSR est actif.
- **`auth=oidc`** : `angular-auth-oidc-client` v22, `provideAuth()` + `withAppInitializerAuthCheck()` + `authInterceptor()`.
- **`i18n`** : Transloco (`@jsverse/transloco`), loader HTTP, fichiers `public/i18n/{fr,en}.json`, sélecteur de langue, synchronisation de `documentElement.lang`.
- **`docker`** : image multi-stage ; nginx + entrypoint générant `config.json` depuis les variables d'environnement (mode SPA), ou image Node lançant le serveur SSR si l'option SSR est active.
- **`ci`** : workflow GitHub Actions `lint` → `test` → `build` pour le projet généré.

## Évolution dans le temps

- Version du package alignée sur le major Angular (`22.x.y`).
- Montée de version du template : bump de `@schematics/angular` et des dépendances ajoutées, matrice e2e, publication `23.0.0` au major suivant.
- Projets déjà générés : `ng update @angular/core` pour Angular, `ng update @floriandrevet/ng-template` pour nos migrations (`migrations.json`, vide au départ).
- Ajouter une option : nouveau dossier schematic + entrée dans `collection.json` + prompt dans `ng-new` + entrée dans la matrice e2e.

## Vérification

- Tests unitaires (`SchematicTestRunner`) par schematic : fichiers générés, dépendances ajoutées, providers présents dans `app.config.ts`.
- Test e2e local : `npm run build && npm pack`, puis `npx -p @angular/cli@22 -p ./floriandrevet-ng-template-*.tgz ng new demo --collection=@floriandrevet/ng-template`, puis dans `demo/` : `npm run lint && npm test && npm run build`.
- CI du repo : matrice e2e `{none, msal, oidc} × {ssr on/off}` avec une variante UI et une i18n.
