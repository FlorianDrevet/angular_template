import { Rule, apply, chain, mergeWith, MergeStrategy, move, url } from '@angular-devkit/schematics';
import { addRootProvider } from '@schematics/angular/utility';
import { addProdDependency } from '../utils/add-dev-dependency';
import { versions } from '../utils/versions';
import { Schema } from './schema';

export default function i18n(options: Schema): Rule {
  return chain([
    mergeWith(apply(url('./files'), [move('/')]), MergeStrategy.Overwrite),
    addProdDependency('@jsverse/transloco', versions.transloco),
    addRootProvider(options.project, ({ code, external }) => code`${external('provideI18n', './core/i18n/provide-i18n')}()`),
  ]);
}
