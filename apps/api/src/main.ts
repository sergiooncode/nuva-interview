import { readFileSync } from 'node:fs';
import type { PropertyRepository } from '@yaya/domain/repository.ts';
import { loadConfig, type Config } from '@yaya/infrastructure/config.ts';
import { createCsvPropertyRepository } from '@yaya/infrastructure/csv/csv-repository.ts';
import { parseCatalogue } from '@yaya/infrastructure/csv/parse-catalogue.ts';
import { assertLoadable } from '@yaya/infrastructure/csv/seed-postgres.ts';
import { createPool } from '@yaya/infrastructure/postgres/pool.ts';
import { createPostgresPropertyRepository } from '@yaya/infrastructure/postgres/postgres-repository.ts';
import { buildServer } from './server.ts';

/**
 * The composition root, and the only place that knows both a config value and a concrete
 * adapter. Everything below it receives a `PropertyRepository` and cannot tell which one.
 */
const openRepository = (config: Config): { repository: PropertyRepository; close: () => Promise<void> } => {
  if (config.PROPERTY_SOURCE === 'postgres') {
    if (config.DATABASE_URL === undefined) throw new Error('DATABASE_URL is required');
    const pool = createPool(config.DATABASE_URL);
    return { repository: createPostgresPropertyRepository(pool), close: () => pool.end() };
  }

  if (config.CSV_PATH === undefined) throw new Error('CSV_PATH is required');
  const catalogue = parseCatalogue(readFileSync(config.CSV_PATH, 'utf8'));
  assertLoadable(catalogue, config.MAX_REJECTED_RATIO);
  return { repository: createCsvPropertyRepository(catalogue), close: () => Promise.resolve() };
};

const config = loadConfig();
const { repository, close } = openRepository(config);
const app = buildServer({ repository, logLevel: config.LOG_LEVEL });

const rejected = repository.rejectedRows();
if (rejected > 0) {
  app.log.warn(`Serving with ${String(rejected)} malformed row(s) rejected at load`);
}

/**
 * Stop accepting connections, drain the ones in flight, then release the pool. Without
 * this an orchestrator's SIGTERM kills requests mid-response on every deploy.
 */
const shutdown = (signal: string) => {
  app.log.info(`${signal} received, draining`);
  void app
    .close()
    .then(close)
    .then(() => {
      process.exit(0);
    });
};
process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});
process.on('SIGINT', () => {
  shutdown('SIGINT');
});

await app.listen({ port: config.PORT, host: config.HOST });
