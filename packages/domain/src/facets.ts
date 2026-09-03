import { z } from 'zod';
import { applyFilters, type FilterState } from './filters.ts';
import { cents, centsFromEuros, CentsSchema } from './money.ts';
import type { Property } from './property.ts';

export const FacetOptionSchema = z.object({
  value: z.number().int().nonnegative(),
  count: z.number().int().nonnegative(),
});

/** `to` is inclusive, matching the range filter's inclusive upper bound. */
export const PriceBucketSchema = z.object({
  from: CentsSchema,
  to: CentsSchema,
  count: z.number().int().nonnegative(),
});

export const FacetsSchema = z.object({
  bedrooms: z.array(FacetOptionSchema),
  price: z.array(PriceBucketSchema),
});

export type FacetOption = z.infer<typeof FacetOptionSchema>;
export type PriceBucket = z.infer<typeof PriceBucketSchema>;
export type Facets = z.infer<typeof FacetsSchema>;

export const PRICE_BUCKET_WIDTH = centsFromEuros(250);

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

const bucketIndexOf = (property: Property): number =>
  Math.floor(property.monthlyRent / PRICE_BUCKET_WIDTH);

/**
 * Bucket edges span the whole catalogue so the histogram keeps its shape as filters
 * change, and every bucket between the cheapest and dearest rent is present even when
 * empty — a histogram with holes in it reads as missing data rather than as no matches.
 */
const countPriceBuckets = (
  properties: readonly Property[],
  counted: readonly Property[],
): PriceBucket[] => {
  if (properties.length === 0) return [];

  const indices = properties.map(bucketIndexOf);
  const first = Math.min(...indices);
  const last = Math.max(...indices);

  const counts = new Map<number, number>();
  for (const property of counted) {
    const index = bucketIndexOf(property);
    counts.set(index, (counts.get(index) ?? 0) + 1);
  }

  return Array.from({ length: last - first + 1 }, (_, offset) => {
    const index = first + offset;
    return {
      from: cents(index * PRICE_BUCKET_WIDTH),
      to: cents((index + 1) * PRICE_BUCKET_WIDTH - 1),
      count: counts.get(index) ?? 0,
    };
  });
};

export const computeFacets = (
  properties: readonly Property[],
  filters: FilterState,
): Facets => ({
  bedrooms: countOptions(
    distinctAscending(properties, bedroomsOf),
    applyFilters(properties, filters, { except: 'bedrooms' }),
    bedroomsOf,
  ),
  price: countPriceBuckets(
    properties,
    applyFilters(properties, filters, { except: 'price' }),
  ),
});
