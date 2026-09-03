import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Property } from '@yaya/domain/property.ts';
import type pg from 'pg';
import { loadConfig } from '../config.ts';
import { createPool } from '../postgres/pool.ts';
import { parseCatalogue, type Catalogue } from './parse-catalogue.ts';

/**
 * One statement for the whole batch: thirteen parallel arrays unnested into rows. It
 * keeps the round trips constant regardless of catalogue size, and the upsert makes
 * re-running the loader safe — seeding twice is the normal case, not an error.
 */
const UPSERT = `
  INSERT INTO properties (
    id, title, brand, neighborhood, status, bedrooms, bathrooms,
    max_occupancy, size_m2, monthly_rent, floor_type, is_exterior, age_label
  )
  SELECT * FROM UNNEST(
    $1::text[],  $2::text[], $3::text[], $4::text[], $5::text[], $6::int[], $7::int[],
    $8::int[],   $9::int[],  $10::int[], $11::text[], $12::bool[], $13::text[]
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title, brand = EXCLUDED.brand, neighborhood = EXCLUDED.neighborhood,
    status = EXCLUDED.status, bedrooms = EXCLUDED.bedrooms, bathrooms = EXCLUDED.bathrooms,
    max_occupancy = EXCLUDED.max_occupancy, size_m2 = EXCLUDED.size_m2,
    monthly_rent = EXCLUDED.monthly_rent, floor_type = EXCLUDED.floor_type,
    is_exterior = EXCLUDED.is_exterior, age_label = EXCLUDED.age_label
`;

const columns = (properties: readonly Property[]): unknown[] => [
  properties.map((p) => p.id),
  properties.map((p) => p.title),
  properties.map((p) => p.brand),
  properties.map((p) => p.neighborhood),
  properties.map((p) => p.status),
  properties.map((p) => p.bedrooms),
  properties.map((p) => p.bathrooms),
  properties.map((p) => p.maxOccupancy),
  properties.map((p) => p.sizeM2),
  properties.map((p) => p.monthlyRent),
  properties.map((p) => p.floorType),
  properties.map((p) => p.isExterior),
  properties.map((p) => p.ageLabel),
];

/**
 * The circuit breaker. Rejecting a bad row individually keeps one typo from blanking the
 * catalogue; refusing the whole load above a threshold keeps a truncated or misencoded
 * file from quietly replacing a working catalogue with a nearly empty one.
 */
export const assertLoadable = (catalogue: Catalogue, maxRejectedRatio: number): void => {
  const total = catalogue.properties.length + catalogue.rejected.length;
  if (total === 0) throw new Error('Refusing to load: the file contained no rows at all');

  const ratio = catalogue.rejected.length / total;
  if (ratio > maxRejectedRatio) {
    throw new Error(
      `Refusing to load: ${String(catalogue.rejected.length)} of ${String(total)} rows rejected ` +
        `(${(ratio * 100).toFixed(1)}%), above the ${(maxRejectedRatio * 100).toFixed(1)}% threshold`,
    );
  }
};

export const seed = async (pool: pg.Pool, catalogue: Catalogue): Promise<number> => {
  if (catalogue.properties.length === 0) return 0;
  await pool.query(UPSERT, columns(catalogue.properties));
  return catalogue.properties.length;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const config = loadConfig();
  if (config.DATABASE_URL === undefined) throw new Error('DATABASE_URL is required to seed');
  if (config.CSV_PATH === undefined) throw new Error('CSV_PATH is required to seed');

  const catalogue = parseCatalogue(readFileSync(config.CSV_PATH, 'utf8'));
  assertLoadable(catalogue, config.MAX_REJECTED_RATIO);

  const pool = createPool(config.DATABASE_URL);
  try {
    const loaded = await seed(pool, catalogue);
    console.log(`Loaded ${String(loaded)} properties`);
    for (const { row, reason } of catalogue.rejected) {
      console.warn(`Rejected row ${String(row)}: ${reason}`);
    }
  } finally {
    await pool.end();
  }
}
