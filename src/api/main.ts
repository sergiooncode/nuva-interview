import { readFileSync } from 'node:fs';
import { parseCatalogue } from '../domain/csv.ts';
import { buildServer } from './server.ts';

const CSV_PATH = new URL('../../data/sre-ai-coding-test-data.csv', import.meta.url);

const catalogue = parseCatalogue(readFileSync(CSV_PATH, 'utf8'));
const app = buildServer(catalogue);

if (catalogue.rejected.length > 0) {
  app.log.warn(
    { rejected: catalogue.rejected },
    `Rejected ${String(catalogue.rejected.length)} malformed CSV row(s)`,
  );
}

await app.listen({ port: 3000 });
