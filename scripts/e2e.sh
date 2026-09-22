#!/usr/bin/env bash
# Generates a project with the given ng-new flags in a scratch directory and
# runs lint/test/build inside it. Used by CI's e2e matrix and can be run
# locally too: `npm run build && npm pack && ./scripts/e2e.sh --ssr=true ...`
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

TGZ="$(ls "$REPO_DIR"/floriandrevet-ng-template-*.tgz | head -1)"

cd "$WORK_DIR"
npm init -y --silent >/dev/null
npm install --silent @angular/cli@22 "$TGZ"

npx ng new demo-app --collection=@floriandrevet/ng-template --skip-install --skip-git "$@"

cd demo-app
npm install --silent
npm run lint
npm test -- --watch=false
npm run build
echo "e2e OK: $*"
