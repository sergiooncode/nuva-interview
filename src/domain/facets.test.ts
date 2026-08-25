import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from './__fixtures__/properties.ts';
import { computeFacets } from './facets.ts';
import { DEFAULT_FILTER_STATE, type FilterState } from './filters.ts';

const withBedrooms = (bedrooms: readonly number[]): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  bedrooms,
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
