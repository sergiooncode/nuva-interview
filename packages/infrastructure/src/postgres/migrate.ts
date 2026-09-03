import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('./migrations', import.meta.url));

/**
 * One arbitrary constant, held for the duration of the run. Several API replicas booting
 * at once is the normal case, not the exceptional one; without this they race to apply
 * the same file and one of them dies on a duplicate object.
 */
const MIGRATION_LOCK = 4_012_007;

const pending = (applied: ReadonlySet<string>): string[] =>
  readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .filter((file) => !applied.has(file));

/**
 * Each file runs inside its own transaction alongside the row that records it, so a
 * migration cannot be half-applied or applied twice. Files are immutable once shipped —
 * changing one that has already run is a new migration, not an edit.
 */
export const migrate = async (databaseUrl: string): Promise<string[]> => {
  const client = new pg.Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       text        PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query<{ name: string }>('SELECT name FROM schema_migrations');
    const outstanding = pending(new Set(rows.map((row) => row.name)));

    for (const name of outstanding) {
      const sql = readFileSync(`${MIGRATIONS_DIR}/${name}`, 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${name} failed: ${String(error)}`);
      }
    }
    return outstanding;
  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK]).catch(() => undefined);
    await client.end();
  }
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { loadConfig } = await import('../config.ts');
  const config = loadConfig();
  if (config.DATABASE_URL === undefined) throw new Error('DATABASE_URL is required to migrate');
  const applied = await migrate(config.DATABASE_URL);
  console.log(applied.length === 0 ? 'No migrations to apply' : `Applied: ${applied.join(', ')}`);
}
