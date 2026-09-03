import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from './__fixtures__/properties.ts';
import { computeFacets } from './facets.ts';
import { DEFAULT_FILTER_STATE, type FilterState } from './filters.ts';
import { centsFromEuros } from './money.ts';

const withBedrooms = (bedrooms: readonly number[]): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  bedrooms,
});

const withPrice = (minEuros: number | null, maxEuros: number | null): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  price: {
    min: minEuros === null ? null : centsFromEuros(minEuros),
    max: maxEuros === null ? null : centsFromEuros(maxEuros),
  },
});

describe('computeFacets', () => {
  it('counts every bedroom option across the available units', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);

    expect(facets.bedrooms).toEqual([
      { value: 0, count: 1 },
      { value: 1, count: 2 },
      { value: 2, count: 1 },
      { value: 3, count: 0 },
      { value: 4, count: 1 },
    ]);
  });

  it('leaves the other bedroom counts untouched when a bedroom option is selected', () => {
    const unselected = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);
    const selected = computeFacets(FIXTURE_PROPERTIES, withBedrooms([1]));

    expect(selected.bedrooms).toEqual(unselected.bedrooms);
  });

  it('still offers the unselected options after selecting every option in turn', () => {
    for (const value of [0, 1, 2, 4]) {
      const facets = computeFacets(FIXTURE_PROPERTIES, withBedrooms([value]));

      expect(facets.bedrooms.filter((option) => option.count > 0)).toHaveLength(4);
    }
  });

  it('retains an option with a zero count rather than omitting it', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);

    expect(facets.bedrooms.map((option) => option.value)).toContain(3);
    expect(facets.bedrooms.find((option) => option.value === 3)).toEqual({
      value: 3,
      count: 0,
    });
  });

  it('counts the reserved and rented units once the scope is widened', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, {
      ...DEFAULT_FILTER_STATE,
      availability: 'all',
    });

    expect(facets.bedrooms).toEqual([
      { value: 0, count: 2 },
      { value: 1, count: 2 },
      { value: 2, count: 2 },
      { value: 3, count: 1 },
      { value: 4, count: 1 },
    ]);
  });

  it('keeps the availability scope applied to the dimension it excludes', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, withBedrooms([3]));

    expect(facets.bedrooms.find((option) => option.value === 3)).toEqual({
      value: 3,
      count: 0,
    });
  });

  it('excludes reserved and rented units from the counts', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);
    const total = facets.bedrooms.reduce((sum, option) => sum + option.count, 0);

    expect(total).toBe(5);
  });

  it('orders the options by bedroom count ascending', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);
    const values = facets.bedrooms.map((option) => option.value);

    expect(values).toEqual([...values].sort((a, b) => a - b));
  });

  it('offers no options for an empty catalogue', () => {
    expect(computeFacets([], DEFAULT_FILTER_STATE).bedrooms).toEqual([]);
  });
});

/**
 * Fixture rents in euros: 760 and 720 (0 bd), 1180 and 1260 (1 bd), 1850 and 1560
 * (2 bd), 2100 (3 bd), 2140 (4 bd) — of which 720, 1560 and 2100 are not available.
 * At 250 € a bucket the catalogue spans 500–749 € up to 2000–2249 €, seven buckets.
 */
describe('computeFacets — price', () => {
  it('buckets the whole catalogue at a fixed width', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);

    expect(facets.price).toEqual([
      { from: 50000, to: 74999, count: 0 },
      { from: 75000, to: 99999, count: 1 },
      { from: 100000, to: 124999, count: 1 },
      { from: 125000, to: 149999, count: 1 },
      { from: 150000, to: 174999, count: 0 },
      { from: 175000, to: 199999, count: 1 },
      { from: 200000, to: 224999, count: 1 },
    ]);
  });

  it('leaves the price buckets untouched when a price range is applied', () => {
    const unfiltered = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);
    const filtered = computeFacets(FIXTURE_PROPERTIES, withPrice(1250, 1500));

    expect(filtered.price).toEqual(unfiltered.price);
  });

  it('narrows the price buckets when another dimension is filtered', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, withBedrooms([1]));

    expect(facets.price.map((bucket) => bucket.count)).toEqual([0, 0, 1, 1, 0, 0, 0]);
  });

  it('narrows the bedroom counts when a price range is applied', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, withPrice(1000, 1300));

    expect(facets.bedrooms).toEqual([
      { value: 0, count: 0 },
      { value: 1, count: 2 },
      { value: 2, count: 0 },
      { value: 3, count: 0 },
      { value: 4, count: 0 },
    ]);
  });

  it('retains empty buckets so the histogram has no gaps', () => {
    const facets = computeFacets(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE);
    const widths = facets.price.map((bucket) => bucket.to - bucket.from + 1);

    expect(widths).toEqual(Array<number>(7).fill(25000));
  });

  it('counts a rent sitting exactly on a bucket edge in the lower bucket', () => {
    const onEdge = [
      { ...FIXTURE_PROPERTIES[0], id: 'edge', monthlyRent: centsFromEuros(1000) },
    ];
    const facets = computeFacets(onEdge, DEFAULT_FILTER_STATE);

    expect(facets.price).toEqual([{ from: 100000, to: 124999, count: 1 }]);
  });

  it('offers no price buckets for an empty catalogue', () => {
    expect(computeFacets([], DEFAULT_FILTER_STATE).price).toEqual([]);
  });
});
