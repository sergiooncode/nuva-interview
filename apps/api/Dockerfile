# The API ships as TypeScript. Node strips types at load, so there is no build step and
# no source map indirection between a stack trace and the file you read.
FROM node:24-alpine AS deps
WORKDIR /app

# Manifests first, so a source-only change does not re-resolve the dependency tree.
COPY package.json package-lock.json ./
COPY apps/api/package.json               apps/api/
COPY packages/domain/package.json        packages/domain/
COPY packages/contracts/package.json     packages/contracts/
COPY packages/application/package.json   packages/application/
COPY packages/infrastructure/package.json packages/infrastructure/
RUN npm ci --omit=dev


FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache wget

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY data ./data

# Never PID 1: without an init, SIGTERM does not reach node and every deploy ends in a
# 10-second SIGKILL instead of a drained shutdown.
RUN apk add --no-cache tini

USER node
EXPOSE 3000

# Liveness only. Readiness is /ready, and it is the orchestrator's business, not the
# container runtime's — a container that is up but not ready should stay up.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/api/src/main.ts"]
