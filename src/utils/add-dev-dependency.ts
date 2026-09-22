import { Rule } from '@angular-devkit/schematics';
import { DependencyType, InstallBehavior, addDependency } from '@schematics/angular/utility';

/**
 * Adds a devDependency without scheduling its own install task.
 *
 * `ng-new` schedules a single `NodePackageInstallTask` itself, once, after
 * `move()`'s relocated the tree to its final directory. Letting
 * `addDependency`'s default `InstallBehavior.Auto` schedule one here would
 * run `npm install` before that move, in the wrong directory.
 */
export function addDevDependency(name: string, version: string): Rule {
  return addDependency(name, version, { type: DependencyType.Dev, install: InstallBehavior.None });
}

/** Same as {@link addDevDependency}, for a runtime dependency. */
export function addProdDependency(name: string, version: string): Rule {
  return addDependency(name, version, { type: DependencyType.Default, install: InstallBehavior.None });
}
