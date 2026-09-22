import { InjectionToken } from '@angular/core';

/**
 * Runtime configuration for the application.
 *
 * This is intentionally NOT read from `environment.ts` (a build-time
 * constant baked into the bundle). Instead it is loaded at startup from
 * `/config.json` (see `provideAppConfig`), so the exact same build artifact
 * can be deployed to every environment ("build once, deploy anywhere") —
 * the Docker entrypoint (see the `docker` schematic) regenerates
 * `config.json` from environment variables on container start.
 */
export interface AppConfig {
  /** Base URL prepended to relative HTTP requests, see `apiBaseUrlInterceptor`. */
  apiUrl: string;
}

export const DEFAULT_APP_CONFIG: AppConfig = {
  apiUrl: 'http://localhost:8080',
};

/**
 * Injected as a single mutable object so `provideAppConfig`'s app
 * initializer can patch it in place once the real values are loaded; every
 * consumer that injects `APP_CONFIG` after bootstrap sees the final values.
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');
