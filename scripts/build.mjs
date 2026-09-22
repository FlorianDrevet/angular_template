#!/usr/bin/env node
// Builds the schematics package: compiles src/**/*.ts with tsc into dist/,
// then copies every non-TypeScript asset (collection.json, migrations.json,
// schema.json files, and the files/** template trees) to the same relative
// path under dist/, since tsc only touches .ts files.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(rootDir, 'src');
const distDir = join(rootDir, 'dist');
const watch = process.argv.includes('--watch');

function run(command, args) {
  // `shell: true` is needed on Windows to resolve npx.cmd; args here are
  // fixed, not user input, so the usual shell-injection concern doesn't
  // apply.
  execFileSync(command, args, { stdio: 'inherit', cwd: rootDir, shell: process.platform === 'win32' });
}

function copyAssets(dir) {
  for (const entry of readdirSync(dir)) {
    const srcPath = join(dir, entry);
    const stats = statSync(srcPath);
    if (stats.isDirectory()) {
      copyAssets(srcPath);
      continue;
    }
    const relPath = relative(srcDir, srcPath).split(/[/\\]/);
    const isTemplateFile = relPath.includes('files');
    // Skip our OWN .ts sources (already compiled by tsc into .js above) —
    // but NOT .ts files under a files/ template tree: those are verbatim
    // Angular source for generated projects and are never compiled here.
    if (srcPath.endsWith('.ts') && !isTemplateFile) {
      continue;
    }
    const destPath = join(distDir, relative(srcDir, srcPath));
    cpSync(srcPath, destPath);
  }
}

console.log('[build] compiling TypeScript…');
run('npx', ['tsc', '-p', 'tsconfig.json', ...(watch ? ['--watch'] : [])]);

if (!existsSync(distDir)) {
  throw new Error(`[build] expected ${distDir} to exist after tsc`);
}

console.log('[build] copying schema.json / files templates / collection.json…');
copyAssets(srcDir);

console.log('[build] done.');
