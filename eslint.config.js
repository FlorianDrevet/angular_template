// @ts-check
const eslint = require('@eslint/js');
const { defineConfig, globalIgnores } = require('eslint/config');
const tseslint = require('typescript-eslint');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = defineConfig([
  globalIgnores(['dist/**', 'node_modules/**', 'src/**/files/**', 'coverage/**']),
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
      },
    },
    extends: [eslint.configs.recommended, tseslint.configs.recommendedTypeChecked, eslintConfigPrettier],
    rules: {
      // Schematics factories are resolved by name/require at runtime, and
      // `require()` is how ng-new reads the running `@angular/cli` version.
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]);
