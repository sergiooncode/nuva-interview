import pg from 'pg';

/**
 * `monthly_rent` is int4 and every count is cast to int in SQL, so nothing arrives as a
 * bigint string. Timeouts are set here rather than left to default: a query that hangs
 * holds a connection, and a pool that never times out turns one slow query into an outage.
 */
export const createPool = (connectionString: string): pg.Pool =>
  new pg.Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
    statement_timeout: 10_000,
  });
