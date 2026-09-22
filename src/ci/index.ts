import { Rule, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

function workflow(options: Schema): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: npm

      - run: npm ci
      - run: npm run lint
      - run: npm test -- --watch=false
      - run: npm run build
${
  options.docker
    ? `
      - name: Build Docker image
        run: docker build -t ${options.project}:ci .
`
    : ''
}`;
}

export default function ci(options: Schema): Rule {
  return (tree: Tree) => {
    tree.create('/.github/workflows/ci.yml', workflow(options));
    return tree;
  };
}
