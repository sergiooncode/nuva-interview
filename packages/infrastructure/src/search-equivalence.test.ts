import { FIXTURE_PROPERTIES } from '@yaya/domain/__fixtures__/properties.ts';
import { DEFAULT_FILTER_STATE, type FilterState } from '@yaya/domain/filters.ts';
import { cents } from '@yaya/domain/money.ts';
import type { PropertyRepository } from '@yaya/domain/repository.ts';
import type pg from 'pg';
import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createCsvPropertyRepository } from './csv/csv-repository.ts';
import { seed } from './csv/seed-postgres.ts';
import { migrate } from './postgres/migrate.ts';
import { createPool } from './postgres/pool.ts';
import { createPostgresPropertyRepository } from './postgres/postgres-repository.ts';

const DATABASE_URL = process.env.TEST_DATABASE_URL;

const filters = (overrides: Partial<FilterState>): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  ...overrides,
});

/**
 * Every meaningful shape of query, including the ones where the two implementations are
 * most likely to disagree: an empty selection, a one-sided range, a bound sitting exactly
 * on a value, and a dimension whose options all fall outside the other dimension.
 */
const CASES: [name: string, filters: FilterState][] = [
  ['the default scope', filters({})],
  ['every status', filters({ availability: 'all' })],
  ['one bedroom option', filters({ bedrooms: [1] })],
  ['several bedroom options', filters({ bedrooms: [0, 2] })],
  ['a bedroom option with nothing available', filters({ bedrooms: [3] })],
  ['a lower bound only', filters({ price: { min: cents(118000), max: null } })],
  ['an upper bound only', filters({ price: { min: null, max: cents(118000) } })],
  ['a bound sitting exactly on a rent', filters({ price: { min: cents(126000), max: cents(126000) } })],
  ['both dimensions at once', filters({ bedrooms: [1, 2], price: { min: cents(120000), max: null } })],
  ['a range matching nothing', filters({ price: { min: cents(900000), max: null } })],
  ['every status with both dimensions', filters({ availability: 'all', bedrooms: [0, 3], price: { min: cents(70000), max: cents(220000) } })],
];

/**
 * The architectural claim is that `FilterState` is a query specification rather than a
 * predicate over an array, and that the store is therefore a choice. This is the test
 * that keeps the claim honest: the same specification through both adapters, asserting
 * identical results and identical facet counts.
 *
 * Skipped without TEST_DATABASE_URL, so the default suite still runs with no database.
 */
describe.skipIf(DATABASE_URL === undefined)('the Postgres adapter agrees with the in-memory one', () => {
  let pool: pg.Pool;
  let inMemory: PropertyRepository;
  let postgres: PropertyRepository;

  beforeAll(async () => {
    if (DATABASE_URL === undefined) return;
    await migrate(DATABASE_URL);
    pool = createPool(DATABASE_URL);
    await pool.query('TRUNCATE properties');
    await seed(pool, { properties: [...FIXTURE_PROPERTIES], rejected: [] });

    inMemory = createCsvPropertyRepository({ properties: [...FIXTURE_PROPERTIES], rejected: [] });
    postgres = createPostgresPropertyRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it.each(CASES)('returns the same rows and counts for %s', async (_name, state) => {
    const expected = await inMemory.search(state);
    const actual = await postgres.search(state);

    expect(actual.results.map((property) => property.id)).toEqual(
      expected.results.map((property) => property.id),
    );
    expect(actual.total).toBe(expected.total);
    expect(actual.facets.bedrooms).toEqual(expected.facets.bedrooms);
    expect(actual.facets.price).toEqual(expected.facets.price);
  });
});
