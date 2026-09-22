import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import { join } from 'node:path';

const COLLECTION_PATH = join(__dirname, '../dist/collection.json');

/**
 * A fresh runner per call (rather than a shared module-level instance) so
 * tests can't leak engine state into each other.
 */
export function createRunner(): SchematicTestRunner {
  return new SchematicTestRunner('@floriandrevet/ng-template', COLLECTION_PATH);
}

export interface NgNewOptions {
  name: string;
  ssr?: boolean;
  ui?: 'none' | 'material' | 'tailwind';
  auth?: 'none' | 'msal' | 'oidc';
  i18n?: boolean;
  docker?: boolean;
  ci?: boolean;
}

/**
 * Runs `ng-new` with install/git always skipped, since tests never touch
 * disk or npm/git. Files land under `/<name>/...` (ng-new's default
 * directory), not at the tree root — use `path(tree, 'src/app/app.ts')`.
 */
export async function generate(options: NgNewOptions): Promise<UnitTestTree> {
  const runner = createRunner();
  return runner.runSchematic('ng-new', {
    skipInstall: true,
    skipGit: true,
    ...options,
  });
}

export function path(options: NgNewOptions, relative: string): string {
  return `/${options.name}/${relative}`;
}

export function packageJson(tree: UnitTestTree, options: NgNewOptions): Record<string, unknown> {
  return JSON.parse(tree.readContent(path(options, 'package.json'))) as Record<string, unknown>;
}

export function dependencyVersion(tree: UnitTestTree, options: NgNewOptions, name: string): string | undefined {
  const pkg = packageJson(tree, options) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
  return pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
}
