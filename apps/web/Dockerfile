# The frontend is static once built, so the runtime image carries no Node at all — only
# nginx and the compiled assets.
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json           apps/web/
COPY packages/domain/package.json    packages/domain/
COPY packages/contracts/package.json packages/contracts/
RUN npm ci

COPY packages ./packages
COPY apps/web ./apps/web
COPY tsconfig.json ./
RUN npm run build -w @yaya/web


# Unprivileged by construction: this image listens on 8080 and runs as nginx, so the
# container needs no root at any point.
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:8080/ >/dev/null || exit 1
