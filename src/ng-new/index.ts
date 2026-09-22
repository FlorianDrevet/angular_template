import { strings } from '@angular-devkit/core';
import { Rule, SchematicContext, Tree, apply, chain, empty, mergeWith, move, noop, schematic } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RepositoryInitializerTask } from '@angular-devkit/schematics/tasks';
import { Schema as NgNewOptions } from './schema';

/**
 * Mirrors the Angular CLI's own `$source: 'ng-cli-version'` schema resolution
 * (see `@schematics/angular/ng-new/schema.json`), which is normally only
 * available when a schematic is invoked directly through the CLI's workflow
 * engine. Because we compose `workspace` + `application` ourselves instead of
 * delegating to the official `ng-new` (which would `move()` the tree before
 * we get a chance to run our own rules at the workspace root), we resolve the
 * same value manually from the `@angular/cli` that is running this command —
 * always resolvable, since that is what is executing `ng new` in the first
 * place.
 */
function resolveCliVersion(): string {
  return (require('@angular/cli/package.json') as { version: string }).version;
}

export default function ngNew(options: NgNewOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const directory = options.directory ?? (options.name.startsWith('@') ? options.name.slice(1) : options.name);
    const projectName = strings.dasherize(options.name);
    const ssr = options.ssr ?? false;
    const ui = options.ui ?? 'none';
    const auth = options.auth ?? 'none';
    const version = resolveCliVersion();

    const workspaceOptions = {
      name: options.name,
      version,
      newProjectRoot: 'projects',
      minimal: false,
      strict: true,
      packageManager: options.packageManager,
    };

    const applicationOptions = {
      name: options.name,
      projectRoot: '',
      inlineStyle: false,
      inlineTemplate: false,
      viewEncapsulation: 'Emulated',
      routing: true,
      prefix: 'app',
      style: 'scss',
      skipTests: false,
      testRunner: 'vitest',
      skipPackageJson: false,
      minimal: false,
      skipInstall: true,
      strict: true,
      standalone: true,
      ssr,
      zoneless: true,
      fileNameStyleGuide: '2025',
    };

    return chain([
      // Mirrors @schematics/angular's own `ng-new`: compose everything as a
      // rule pipeline applied to an empty tree and merged in one go, rather
      // than chaining bare `schematic()` calls — chaining them individually
      // causes spurious merge conflicts on files (like package.json) that
      // more than one inner schematic touches.
      mergeWith(
        apply(empty(), [
          schematic('workspace', workspaceOptions),
          schematic('application', applicationOptions),
          schematic('base', { project: projectName, ssr }),
          schematic('ui', { project: projectName, kind: ui }),
          auth !== 'none' ? schematic('auth', { project: projectName, provider: auth, ssr }) : noop(),
          options.i18n ? schematic('i18n', { project: projectName }) : noop(),
          options.docker ? schematic('docker', { project: projectName, ssr }) : noop(),
          options.ci ? schematic('ci', { project: projectName, docker: options.docker ?? false }) : noop(),
          move(directory),
        ]),
      ),
      (_tree: Tree, ctx: SchematicContext) => {
        let installTaskId;
        if (!options.skipInstall) {
          installTaskId = ctx.addTask(new NodePackageInstallTask({ workingDirectory: directory, packageManager: options.packageManager }));
        }
        if (!options.skipGit) {
          ctx.addTask(
            new RepositoryInitializerTask(directory, { name: 'Angular Template', email: 'noreply@localhost' }),
            installTaskId ? [installTaskId] : [],
          );
        }
      },
    ])(tree, context);
  };
}
