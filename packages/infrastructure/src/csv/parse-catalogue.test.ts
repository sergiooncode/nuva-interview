import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parseCatalogue } from './parse-catalogue.ts';

/**
 * Six data rows on lines 2–7. Three are valid; three are malformed in a different
 * way each — an unparseable bedroom count, a short row, and a foreign currency.
 */
const CATALOGUE = readFileSync(
  new URL('./catalogue.fixture.csv', import.meta.url),
  'utf8',
);

describe('parseCatalogue', () => {
  it('parses the valid rows and serves them past the malformed ones', () => {
    const { properties } = parseCatalogue(CATALOGUE);

    expect(properties.map((property) => property.id)).toEqual([
      'apt_001',
      'apt_003',
      'apt_006',
    ]);
  });

  it('rejects each malformed row with its CSV line number', () => {
    const { rejected } = parseCatalogue(CATALOGUE);

    expect(rejected).toHaveLength(3);
    expect(rejected.map((reject) => reject.row)).toEqual([3, 5, 6]);
  });

  it('names the offending field in the rejection reason', () => {
    const { rejected } = parseCatalogue(CATALOGUE);

    expect(rejected[0].reason).toContain('bedrooms');
    expect(rejected[2].reason).toContain('currency');
  });

  it('keeps a studio, whose zero bedrooms a truthiness check would discard', () => {
    const { properties } = parseCatalogue(CATALOGUE);

    expect(properties[0]).toMatchObject({ id: 'apt_001', bedrooms: 0 });
  });

  it('reads the string "false" as false rather than as a truthy string', () => {
    const { properties } = parseCatalogue(CATALOGUE);

    expect(properties[1]).toMatchObject({ id: 'apt_003', isExterior: false });
  });

  it('converts euros to integer cents at the parse boundary', () => {
    const { properties } = parseCatalogue(CATALOGUE);

    expect(properties[0].monthlyRent).toBe(76000);
  });

  it('finds nothing to reject in a file of entirely valid rows', () => {
    const header = CATALOGUE.split('\n')[0];
    const valid = CATALOGUE.split('\n')[1];

    expect(parseCatalogue(`${header}\n${valid}\n`).rejected).toEqual([]);
  });
});
