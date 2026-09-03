import { PRICE_BUCKET_WIDTH, type FacetOption, type PriceBucket } from '@yaya/domain/facets.ts';
import type { FilterDimension, FilterState } from '@yaya/domain/filters.ts';
import { cents } from '@yaya/domain/money.ts';
import { PropertySchema, type Property } from '@yaya/domain/property.ts';
import type { PropertyRepository, SearchOutcome } from '@yaya/domain/repository.ts';
import pg from 'pg';

/** Column list aliased to the domain's names, so a row parses without a mapping layer. */
const COLUMNS = `
  id, title, brand, neighborhood, status, bedrooms, bathrooms,
  max_occupancy AS "maxOccupancy", size_m2      AS "sizeM2",
  monthly_rent  AS "monthlyRent",  floor_type   AS "floorType",
  is_exterior   AS "isExterior",   age_label    AS "ageLabel"
`;

type Where = { clause: string; params: unknown[] };

/**
 * The `except` parameter means exactly what it means in the in-memory filter: leave this
 * one dimension unapplied so its own facet can count the options its selection would
 * otherwise hide. The availability scope is never excepted — it constrains results and
 * every count alike.
 */
const buildWhere = (filters: FilterState, except: FilterDimension | null): Where => {
  const clauses: string[] = [];
  const params: unknown[] = [];
  const bind = (value: unknown): string => `$${String(params.push(value))}`;

  if (filters.availability === 'available') clauses.push(`status = ${bind('available')}`);

  if (except !== 'bedrooms' && filters.bedrooms.length > 0) {
    clauses.push(`bedrooms = ANY(${bind([...filters.bedrooms])}::int[])`);
  }
  if (except !== 'price') {
    if (filters.price.min !== null) clauses.push(`monthly_rent >= ${bind(filters.price.min)}`);
    if (filters.price.max !== null) clauses.push(`monthly_rent <= ${bind(filters.price.max)}`);
  }

  return { clause: clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`, params };
};

/**
 * The option universe comes from the whole table and the counts from the filtered set,
 * joined so an option with no matches comes back as zero rather than vanishing. That is
 * the same invariant the in-memory implementation holds, expressed as a LEFT JOIN.
 */
const bedroomFacetSql = (where: Where): string => `
  WITH universe AS (SELECT DISTINCT bedrooms FROM properties),
       counted  AS (SELECT bedrooms, COUNT(*)::int AS count FROM properties ${where.clause} GROUP BY bedrooms)
  SELECT u.bedrooms AS value, COALESCE(c.count, 0) AS count
  FROM universe u LEFT JOIN counted c ON c.bedrooms = u.bedrooms
  ORDER BY u.bedrooms
`;

/**
 * `generate_series` over the span of the whole table is what keeps the histogram free of
 * holes: every bucket between the cheapest and dearest rent is emitted, empty ones as
 * zero. An empty table yields a NULL span and therefore no rows, which is the same answer
 * the in-memory version gives.
 */
const priceFacetSql = (where: Where, widthParam: string): string => `
  WITH span AS (
    SELECT MIN(monthly_rent) / ${widthParam} AS first,
           MAX(monthly_rent) / ${widthParam} AS last
    FROM properties
  ),
  buckets AS (SELECT generate_series(first, last) AS idx FROM span),
  counted AS (
    SELECT monthly_rent / ${widthParam} AS idx, COUNT(*)::int AS count
    FROM properties ${where.clause}
    GROUP BY 1
  )
  SELECT b.idx, COALESCE(c.count, 0) AS count
  FROM buckets b LEFT JOIN counted c ON c.idx = b.idx
  ORDER BY b.idx
`;

export const createPostgresPropertyRepository = (pool: pg.Pool): PropertyRepository => ({
  /**
   * Results and both facets are read inside one REPEATABLE READ transaction, so the list
   * and the counts are provably the same snapshot even while the catalogue is being
   * updated. In memory that consistency is a side effect of immutability; here it is the
   * isolation level, chosen rather than inherited.
   */
  search: async (filters: FilterState): Promise<SearchOutcome> => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ');

      const all = buildWhere(filters, null);
      const rows = await client.query<Record<string, unknown>>(
        `SELECT ${COLUMNS} FROM properties ${all.clause} ORDER BY id`,
        all.params,
      );

      const forBedrooms = buildWhere(filters, 'bedrooms');
      const bedrooms = await client.query<FacetOption>(
        bedroomFacetSql(forBedrooms),
        forBedrooms.params,
      );

      const forPrice = buildWhere(filters, 'price');
      const width = `$${String(forPrice.params.push(PRICE_BUCKET_WIDTH))}`;
      const price = await client.query<{ idx: number; count: number }>(
        priceFacetSql(forPrice, width),
        forPrice.params,
      );

      await client.query('COMMIT');

      // The database is an untrusted boundary like any other: rows are parsed, not cast.
      const results: Property[] = rows.rows.map((row) => PropertySchema.parse(row));
      const buckets: PriceBucket[] = price.rows.map(({ idx, count }) => ({
        from: cents(idx * PRICE_BUCKET_WIDTH),
        to: cents((idx + 1) * PRICE_BUCKET_WIDTH - 1),
        count,
      }));

      return { results, facets: { bedrooms: bedrooms.rows, price: buckets }, total: results.length };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  },

  /** Rows refused during ingestion are reported by the loader, not carried in the table. */
  rejectedRows: () => 0,

  verifyReadiness: async () => {
    await pool.query('SELECT 1 FROM properties LIMIT 1');
  },
});
