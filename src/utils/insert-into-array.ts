import { SchematicsException, Tree } from '@angular-devkit/schematics';

/**
 * Textual insertion helpers for the two array literals feature schematics
 * need to extend without a full AST rewrite: the routes array in
 * `app.routes.ts` and the interceptor list in `core/http/interceptors.ts`.
 *
 * This only works because the `base` schematic controls the exact shape of
 * both files (see `src/base/files/base`), so the anchor strings below are
 * guaranteed to be present. For anything that touches `app.config.ts`
 * itself, prefer the official `addRootProvider`/`addRootImport` from
 * `@schematics/angular/utility`, which are AST-aware.
 */

const ROUTES_PATH = '/src/app/app.routes.ts';
const WILDCARD_ROUTE_ANCHOR = `  {\n    path: '**',`;

/**
 * Inserts a route object literal right before the `path: '**'` catch-all,
 * optionally adding an import statement it depends on (e.g. a guard) right
 * after the existing `import { Routes } from '@angular/router';` line.
 */
export function insertRouteBeforeWildcard(tree: Tree, routeLiteral: string, importStatement?: string): void {
  let content = tree.readText(ROUTES_PATH);
  if (!content.includes(WILDCARD_ROUTE_ANCHOR)) {
    throw new SchematicsException(`Could not find the wildcard route in ${ROUTES_PATH}; it may have been modified in an incompatible way.`);
  }
  if (importStatement && !content.includes(importStatement)) {
    content = content.replace("import { Routes } from '@angular/router';", `import { Routes } from '@angular/router';\n${importStatement}`);
  }
  tree.overwrite(ROUTES_PATH, content.replace(WILDCARD_ROUTE_ANCHOR, `${routeLiteral}\n${WILDCARD_ROUTE_ANCHOR}`));
}

const INTERCEPTORS_PATH = '/src/app/core/http/interceptors.ts';

/**
 * Adds an interceptor expression (e.g. `authInterceptor()`) to the
 * `httpInterceptors` array, plus the import statement it needs.
 */
export function addHttpInterceptor(tree: Tree, importStatement: string, interceptorExpression: string): void {
  let content = tree.readText(INTERCEPTORS_PATH);
  if (content.includes(interceptorExpression)) {
    return; // already added
  }
  if (!content.includes(importStatement)) {
    content = `${importStatement}\n${content}`;
  }
  content = content.replace(
    /export const httpInterceptors: HttpInterceptorFn\[] = \[([^\]]*)];/,
    (_match, existing: string) => `export const httpInterceptors: HttpInterceptorFn[] = [${existing.trim()}, ${interceptorExpression}];`,
  );
  tree.overwrite(INTERCEPTORS_PATH, content);
}
