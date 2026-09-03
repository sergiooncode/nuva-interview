import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = fileURLToPath(new URL('../../../', import.meta.url));

/**
 * Every path glob the lint config scopes a rule to, e.g. `packages/domain/**\/*.ts`.
 * Read as text rather than imported: the config is a JS module with no declarations, and
 * a test that has to reach for `any` to check a boundary is not much of a guard.
 */
const scopedGlobs = (): string[] => {
  const source = readFileSync(`${ROOT}eslint.config.js`, 'utf8');
  return [...source.matchAll(/files:\s*\[([^\]]*)\]/g)]
    .flatMap(([, list]) => [...list.matchAll(/'([^']+)'/g)].map(([, glob]) => glob))
    .filter((glob) => glob.includes('/**'));
};

/** `packages/domain/**\/*.ts` -> `packages/domain`, the part that can go stale. */
const directoryOf = (glob: string): string => glob.split('/**')[0] ?? glob;

/**
 * The layering rules in `eslint.config.js` key off literal path globs. Rename a package
 * and the glob matches nothing — ESLint does not complain about a rule that applies to no
 * files, so the boundary silently stops being enforced. Build green, tests green, guard
 * gone, and nobody finds out until the web app is importing an adapter again.
 *
 * This is the alarm on that door. Prose describing the layout cannot be verified; this
 * can, so moving a directory without updating its rule fails here first.
 */
describe('the layering rules point at directories that exist', () => {
  const globs = scopedGlobs();

  it('still scopes a rule to each layer that is meant to have one', () => {
    expect(globs.map(directoryOf)).toEqual(
      expect.arrayContaining(['apps/web', 'packages/domain', 'packages/application']),
    );
  });

  it.each(globs)('has a real directory behind %s', (glob) => {
    const directory = directoryOf(glob);
    expect(existsSync(`${ROOT}${directory}`), `${directory} does not exist`).toBe(true);
  });
});
