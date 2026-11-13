# Project guide

This app uses Angular 22 with standalone components, strict TypeScript, zoneless change detection and `OnPush` change detection.

## Project conventions

- Read `.agents/skills/angular-feature/SKILL.md` before building a substantial route, UI feature, or API integration.
- Keep feature UI in `src/app/features/` and shared application code in `src/app/core/`.
- Use lazy `loadComponent` routes. Add new routes before the wildcard route in `src/app/app.routes.ts`.
- Prefer signals for local reactive state, typed inputs and outputs, `inject()` for dependency injection, and `ChangeDetectionStrategy.OnPush` for components.
- Use semantic HTML, keyboard-accessible controls, responsive layouts and the shared SCSS tokens in `src/scss/_tokens.scss`.
- Make browser-only APIs safe for SSR. Avoid reading `window`, `document`, or browser storage at module load time; use a browser platform check or a client-rendered route where needed.
- Read runtime settings through `APP_CONFIG` and `public/config.json`. API requests should use relative URLs so the configured HTTP interceptor can apply `apiUrl`. Never put secrets in browser code or public config.
- Keep authentication and localization changes inside their existing feature areas and provider setup.

## Commands

- `npm start` starts the development server.
- `npm test` runs the Vitest suite.
- `npm run lint` checks the project with ESLint.
- `npm run format:check` checks formatting; `npm run format` applies it.
- `npm run build` creates the production build.
