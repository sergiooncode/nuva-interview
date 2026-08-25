import { z } from 'zod';
import type { Property } from './property.ts';

export const FILTER_DIMENSIONS = ['bedrooms'] as const;
export type FilterDimension = (typeof FILTER_DIMENSIONS)[number];

export const AVAILABILITY_SCOPES = ['available', 'all'] as const;

export const FilterStateSchema = z.object({
  bedrooms: z.array(z.number().int().min(0)).readonly(),
  availability: z.enum(AVAILABILITY_SCOPES),
});

export type FilterState = z.infer<typeof FilterStateSchema>;
export type AvailabilityScope = FilterState['availability'];

/**
 * Every dimension unconstrained, availability scoped to available only. Reset
 * assigns this wholesale, so a dimension added later resets without touching Reset.
 */
export const DEFAULT_FILTER_STATE: FilterState = {
  bedrooms: [],
  availability: 'available',
};

/**
 * `status` is a scope, not a facet dimension: it yields no counts of its own, it
 * constrains the results and every facet count alike, and `except` never lifts it.
 */
const isInScope = (property: Property, availability: AvailabilityScope): boolean =>
  availability === 'all' || property.status === 'available';

/** An empty selection is no constraint; several values within a dimension are OR. */
const matchesBedrooms = (property: Property, selected: readonly number[]): boolean =>
  selected.length === 0 || selected.includes(property.bedrooms);

/**
 * `except` names the dimension to leave unapplied, which is how a facet counts the
 * options its own selection would otherwise hide. Search passes null.
 */
export const applyFilters = (
  properties: readonly Property[],
  filters: FilterState,
  { except }: { except: FilterDimension | null },
): Property[] =>
  properties.filter(
    (property) =>
      isInScope(property, filters.availability) &&
      (except === 'bedrooms' || matchesBedrooms(property, filters.bedrooms)),
  );
