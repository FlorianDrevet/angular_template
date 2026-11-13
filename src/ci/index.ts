import { Rule, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

function workflow(options: Schema): string {
  return `name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        node-version: [22, 24, 26]
    steps:
      - uses: actions/checkout@v7

      - uses: actions/setup-node@v7
        with:
          node-version: \${{ matrix.node-version }}
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
