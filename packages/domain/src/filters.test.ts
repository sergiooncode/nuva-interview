import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from './__fixtures__/properties.ts';
import { applyFilters, DEFAULT_FILTER_STATE, type FilterState } from './filters.ts';
import { cents, centsFromEuros } from './money.ts';

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

/** Available fixture rents in euros: 760, 1180, 1260, 1850, 2140. */
describe('applyFilters — price', () => {
  const priced = (minEuros: number | null, maxEuros: number | null): FilterState =>
    filters({
      price: {
        min: minEuros === null ? null : centsFromEuros(minEuros),
        max: maxEuros === null ? null : centsFromEuros(maxEuros),
      },
    });

  it('includes a rent sitting exactly on the lower bound', () => {
    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, priced(1180, null), { except: null })))
      .toEqual(['fx_03', 'fx_04', 'fx_05', 'fx_08']);
  });

  it('includes a rent sitting exactly on the upper bound', () => {
    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, priced(null, 1180), { except: null })))
      .toEqual(['fx_01', 'fx_03']);
  });

  it('excludes a rent one cent below the lower bound', () => {
    const justAbove = filters({
      price: { min: cents(centsFromEuros(1180) + 1), max: null },
    });

    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, justAbove, { except: null }))).toEqual([
      'fx_04',
      'fx_05',
      'fx_08',
    ]);
  });

  it('excludes a rent one cent above the upper bound', () => {
    const justBelow = filters({
      price: { min: null, max: cents(centsFromEuros(1180) - 1) },
    });

    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, justBelow, { except: null }))).toEqual([
      'fx_01',
    ]);
  });

  it('constrains only one side when the maximum is absent', () => {
    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, priced(2000, null), { except: null })))
      .toEqual(['fx_08']);
  });

  it('constrains only one side when the minimum is absent', () => {
    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, priced(null, 800), { except: null })))
      .toEqual(['fx_01']);
  });

  it('treats an unbounded range as no constraint', () => {
    const unbounded = applyFilters(FIXTURE_PROPERTIES, priced(null, null), {
      except: null,
    });

    expect(unbounded).toEqual(
      applyFilters(FIXTURE_PROPERTIES, DEFAULT_FILTER_STATE, { except: null }),
    );
  });

  it('ANDs the price range with the bedroom dimension', () => {
    const both = filters({
      bedrooms: [1, 2],
      price: { min: centsFromEuros(1250), max: null },
    });

    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, both, { except: null }))).toEqual([
      'fx_04',
      'fx_05',
    ]);
  });

  it('lifts the price range but keeps the bedroom dimension when excepted', () => {
    const both = filters({
      bedrooms: [1],
      price: { min: centsFromEuros(5000), max: null },
    });

    expect(idsOf(applyFilters(FIXTURE_PROPERTIES, both, { except: 'price' }))).toEqual([
      'fx_03',
      'fx_04',
    ]);
  });
});
