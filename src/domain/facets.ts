import { z } from 'zod';
import { applyFilters, type FilterState } from './filters.ts';
import type { Property } from './property.ts';

export const FacetOptionSchema = z.object({
  value: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

export const FacetsSchema = z.object({
  bedrooms: z.array(FacetOptionSchema),
});

export type FacetOption = z.infer<typeof FacetOptionSchema>;
export type Facets = z.infer<typeof FacetsSchema>;

/**
 * The option universe comes from the whole catalogue, not the filtered set, so an
 * option never disappears — it goes to zero and the UI greys it out.
 */
const distinctAscending = (
  properties: readonly Property[],
  of: (property: Property) => number,
): number[] => [...new Set(properties.map(of))].sort((a, b) => a - b);

const countOptions = (
  universe: readonly number[],
  counted: readonly Property[],
  of: (property: Property) => number,
): FacetOption[] => {
  const counts = new Map<number, number>(universe.map((value) => [value, 0]));
  for (const property of counted) {
    counts.set(of(property), (counts.get(of(property)) ?? 0) + 1);
  }
  return universe.map((value) => ({ value, count: counts.get(value) ?? 0 }));
};

const bedroomsOf = (property: Property): number => property.bedrooms;

export const computeFacets = (
  properties: readonly Property[],
  filters: FilterState,
): Facets => ({
  bedrooms: countOptions(
    distinctAscending(properties, bedroomsOf),
    applyFilters(properties, filters, { except: 'bedrooms' }),
    bedroomsOf,
  ),
});
