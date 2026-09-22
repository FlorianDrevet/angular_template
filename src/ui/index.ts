import { Rule, Tree, chain, noop, schematic } from '@angular-devkit/schematics';
import { addProdDependency } from '../utils/add-dev-dependency';
import { versions } from '../utils/versions';
import { Schema } from './schema';

// Sass requires every `@use` to precede all other rules in the file, so this
// import line is inserted right after the existing `@use './scss/tokens';`
// (see base/index.ts's STYLES_SCSS) rather than appended at the end.
const MATERIAL_USE = "@use '@angular/material' as mat;";

const MATERIAL_THEME_SCSS = `
// Angular Material theming (M3) — see https://material.angular.dev/guide/theming

html {
  @include mat.theme(
    (
      color: (
        primary: mat.$azure-palette,
        tertiary: mat.$blue-palette,
      ),
      typography: Roboto,
      density: 0,
    )
  );
}

body {
  background-color: var(--mat-sys-surface);
  color: var(--mat-sys-on-surface);
  font: var(--mat-sys-body-medium);
}
`;

const MATERIAL_FONT_LINKS = [
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500&display=swap" rel="stylesheet">',
  '<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">',
];

function writeMaterialTheme(): Rule {
  return (tree: Tree) => {
    let styles = tree.readText('/src/styles.scss');
    if (!styles.includes(MATERIAL_USE)) {
      styles = styles.includes("@use './scss/tokens';")
        ? styles.replace("@use './scss/tokens';", `@use './scss/tokens';\n${MATERIAL_USE}`)
        : `${MATERIAL_USE}\n${styles}`;
      tree.overwrite('/src/styles.scss', `${styles}\n${MATERIAL_THEME_SCSS}`);
    }

    const indexHtml = tree.readText('/src/index.html');
    if (!indexHtml.includes('fonts.googleapis.com') && indexHtml.includes('</head>')) {
      const links = MATERIAL_FONT_LINKS.map((link) => `  ${link}`).join('\n');
      tree.overwrite('/src/index.html', indexHtml.replace('</head>', `${links}\n</head>`));
    }

    return tree;
  };
}

export default function ui(options: Schema): Rule {
  switch (options.kind) {
    case 'tailwind':
      // Delegates to Angular's own built-in Tailwind setup (the same
      // schematic `ng new --style=tailwind` uses under the hood): adds
      // `tailwindcss`/`@tailwindcss/postcss`/`postcss`, a `.postcssrc.json`,
      // and a stylesheet with `@import 'tailwindcss';`. See
      // @schematics/angular/tailwind for the implementation.
      return schematic('tailwind', { project: options.project, skipInstall: true });
    case 'material':
      return chain([
        writeMaterialTheme(),
        addProdDependency('@angular/material', versions.angularMaterial),
        addProdDependency('@angular/cdk', versions.angularMaterial),
      ]);
    case 'none':
    default:
      return noop();
  }
}
