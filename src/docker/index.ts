import { Rule, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

const DOCKERIGNORE = `node_modules
dist
.angular
.git
.husky
*.md
Dockerfile
.dockerignore
`;

function spaDockerfile(project: string): string {
  return `# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist/${project}/browser /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
# nginx's own image runs every executable script under /docker-entrypoint.d/
# before starting — this one regenerates config.json from env vars, so the
# same image can be deployed to every environment ("build once, deploy
# anywhere"). See src/app/core/config/provide-app-config.ts.
COPY docker/docker-entrypoint.sh /docker-entrypoint.d/30-generate-config.sh
RUN chmod +x /docker-entrypoint.d/30-generate-config.sh

EXPOSE 80
`;
}

function ssrDockerfile(project: string): string {
  return `# syntax=docker/dockerfile:1

# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/dist/${project} ./dist/${project}
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json

# The first SSR paint uses provideAppConfig()'s defaults (it only fetches
# config.json in the browser, see that file's comment); the client corrects
# it during hydration. Read API_URL from process.env in server.ts yourself
# if you need it on the very first server-rendered response.
EXPOSE 4000
CMD ["node", "dist/${project}/server/server.mjs"]
`;
}

const NGINX_CONF = `server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;

  location = /config.json {
    add_header Cache-Control "no-store";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

const DOCKER_ENTRYPOINT_SH = `#!/bin/sh
# Regenerates config.json from environment variables at container start, so
# the image built once in CI can be deployed to every environment without a
# rebuild. See src/app/core/config/provide-app-config.ts.
set -eu

CONFIG_PATH="/usr/share/nginx/html/config.json"

cat <<JSON > "$CONFIG_PATH"
{
  "apiUrl": "\${API_URL:-http://localhost:8080}"
}
JSON
`;

export default function docker(options: Schema): Rule {
  return (tree: Tree) => {
    tree.create('/Dockerfile', options.ssr ? ssrDockerfile(options.project) : spaDockerfile(options.project));
    tree.create('/.dockerignore', DOCKERIGNORE);
    if (!options.ssr) {
      tree.create('/docker/nginx.conf', NGINX_CONF);
      tree.create('/docker/docker-entrypoint.sh', DOCKER_ENTRYPOINT_SH);
    }
    return tree;
  };
}
