import { z } from 'zod';
import { CentsSchema } from './money.ts';
import type { Property } from './property.ts';

export const FILTER_DIMENSIONS = ['bedrooms', 'price'] as const;
export type FilterDimension = (typeof FILTER_DIMENSIONS)[number];

export const AVAILABILITY_SCOPES = ['available', 'all'] as const;

/**
 * Each bound is independently optional — null means unbounded on that side, so a
 * minimum with no maximum is a legitimate range and constrains one side only.
 */
export const PriceRangeSchema = z
  .object({
    min: CentsSchema.nullable(),
    max: CentsSchema.nullable(),
  })
  .refine((range) => range.min === null || range.max === null || range.min <= range.max, {
    message: 'min must not exceed max',
  });

export type PriceRange = z.infer<typeof PriceRangeSchema>;

export const FilterStateSchema = z.object({
  bedrooms: z.array(z.number().int().min(0)).readonly(),
  price: PriceRangeSchema,
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
  price: { min: null, max: null },
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

/** Both bounds are inclusive, and either may be absent. */
const matchesPrice = (property: Property, range: PriceRange): boolean =>
  (range.min === null || property.monthlyRent >= range.min) &&
  (range.max === null || property.monthlyRent <= range.max);

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
      (except === 'bedrooms' || matchesBedrooms(property, filters.bedrooms)) &&
      (except === 'price' || matchesPrice(property, filters.price)),
  );
