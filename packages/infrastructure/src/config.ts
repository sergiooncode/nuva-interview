import { readFileSync } from 'node:fs';
import { z } from 'zod';

/**
 * Reading the environment is infrastructure, so it happens here and nowhere else — the
 * domain and the use cases receive values, never `process.env`.
 *
 * Every secret also accepts a `_FILE` variant pointing at a path. That is the convention
 * Docker secrets, Kubernetes projected volumes and the AWS Secrets Manager CSI driver all
 * mount, so moving off plain environment variables later is a deployment change rather
 * than a code change.
 */
const fromEnvOrFile = (env: NodeJS.ProcessEnv, name: string): string | undefined => {
  const path = env[`${name}_FILE`];
  if (path !== undefined && path !== '') return readFileSync(path, 'utf8').trim();
  const value = env[name];
  return value === '' ? undefined : value;
};

const ConfigSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().min(1).default('0.0.0.0'),
    PORT: z.coerce.number().int().positive().max(65535).default(3000),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

    PROPERTY_SOURCE: z.enum(['csv', 'postgres']).default('csv'),
    CSV_PATH: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1).optional(),

    /**
     * The circuit breaker on ingestion. Rejecting a bad row keeps one typo from blanking
     * the catalogue; refusing to start above this ratio keeps a wholly broken file from
     * being served as an empty catalogue that looks perfectly healthy.
     */
    MAX_REJECTED_RATIO: z.coerce.number().min(0).max(1).default(0.2),
  })
  .superRefine((config, ctx) => {
    if (config.PROPERTY_SOURCE === 'csv' && config.CSV_PATH === undefined) {
      ctx.addIssue({ code: 'custom', path: ['CSV_PATH'], message: 'required when PROPERTY_SOURCE=csv' });
    }
    if (config.PROPERTY_SOURCE === 'postgres' && config.DATABASE_URL === undefined) {
      ctx.addIssue({ code: 'custom', path: ['DATABASE_URL'], message: 'required when PROPERTY_SOURCE=postgres' });
    }
  });

export type Config = z.infer<typeof ConfigSchema>;

/**
 * Fails at boot with every problem named at once, rather than at the first request with
 * an undefined creeping through three layers.
 */
export const loadConfig = (env: NodeJS.ProcessEnv = process.env): Config => {
  const parsed = ConfigSchema.safeParse({
    NODE_ENV: env.NODE_ENV,
    HOST: env.HOST,
    PORT: env.PORT,
    LOG_LEVEL: env.LOG_LEVEL,
    PROPERTY_SOURCE: env.PROPERTY_SOURCE,
    CSV_PATH: env.CSV_PATH,
    DATABASE_URL: fromEnvOrFile(env, 'DATABASE_URL'),
    MAX_REJECTED_RATIO: env.MAX_REJECTED_RATIO,
  });

  if (!parsed.success) {
    const problems = parsed.error.issues
      .map((issue) => `  ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid configuration:\n${problems}`);
  }
  return parsed.data;
};
