import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from './__fixtures__/properties.ts';
import { applyFilters, DEFAULT_FILTER_STATE, type FilterState } from './filters.ts';

const filters = (overrides: Partial<FilterState>): FilterState => ({
  ...DEFAULT_FILTER_STATE,
  ...overrides,
});

const idsOf = (properties: { id: string }[]): string[] => properties.map((p) => p.id);

describe('applyFilters', () => {
  it('treats an empty bedroom selection as no constraint', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE, {
      except: null,
    });

    expect(idsOf(matched)).toEqual(['fx_01', 'fx_03', 'fx_04', 'fx_05', 'fx_08']);
  });

  it('ORs several values within the bedroom dimension', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, filters({ bedrooms: [0, 4] }), {
      except: null,
    });

    expect(idsOf(matched)).toEqual(['fx_01', 'fx_08']);
  });

  it('matches nothing when the selected bedroom count has no available unit', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, filters({ bedrooms: [3] }), {
      except: null,
    });

    expect(matched).toEqual([]);
  });

  it('scopes out reserved and rented units by default', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE, {
      except: null,
    });

    expect(matched.every((property) => property.status === 'available')).toBe(true);
  });

  it('admits every status once availability is widened to all', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, filters({ availability: 'all' }), {
      except: null,
    });

    expect(matched).toHaveLength(FIXTURE_PROPERTIES.length);
  });

  it('lifts the named dimension but never the availability scope', () => {
    const matched = applyFilters(FIXTURE_PROPERTIES, filters({ bedrooms: [3] }), {
      except: 'bedrooms',
    });

    // The bedroom constraint is gone, so this is every available unit — and the
    // rented 3-bedroom fx_07 is still absent because `except` does not reach the scope.
    expect(idsOf(matched)).toEqual(['fx_01', 'fx_03', 'fx_04', 'fx_05', 'fx_08']);
  });

  it('combines the bedroom dimension and the availability scope with AND', () => {
    const matched = applyFilters(
      FIXTURE_PROPERTIES,
      filters({ bedrooms: [2], availability: 'all' }),
      { except: null },
    );

    expect(idsOf(matched)).toEqual(['fx_05', 'fx_06']);
  });
});
