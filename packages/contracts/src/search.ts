import { z } from 'zod';
import { FacetsSchema } from '@yaya/domain/facets.ts';
import {
  AVAILABILITY_SCOPES,
  DEFAULT_FILTER_STATE,
  type FilterState,
} from '@yaya/domain/filters.ts';
import { centsFromEuros } from '@yaya/domain/money.ts';
import { PropertySchema } from '@yaya/domain/property.ts';

/**
 * Bounded on both axes. The client controls how many values it sends and how long each
 * one is, and every value is compared against every row, so an unbounded list is an
 * unbounded amount of work bought with one request.
 */
const commaSeparatedWholeNumbers = (field: string) =>
  z
    .string()
    .max(200)
    .transform((raw) => raw.split(',').filter((part) => part !== ''))
    .pipe(
      z
        .array(z.string().regex(/^\d{1,3}$/, `${field} must be whole numbers`))
        .max(50, `${field} accepts at most 50 values`),
    )
    .transform((parts) => parts.map(Number));

/**
 * Prices travel the wire in whole euros and become cents here.
 *
 * The digit cap is load-bearing rather than cosmetic: an unbounded run of digits parses
 * to `Infinity`, `centsFromEuros` throws a `DomainError`, and a throw inside a
 * `.transform()` escapes `safeParse` instead of becoming an issue — which would answer a
 * malformed query parameter with a 500 rather than a 400 naming the field.
 */
const wholeEuros = (field: string) =>
  z
    .string()
    .regex(/^\d{1,7}$/, `${field} must be a whole number of euros`)
    .transform((raw) => centsFromEuros(Number(raw)));

/**
 * Strict: a typo'd filter name is a 400, not a silent unfiltered result. An absent
 * param falls back to the canonical default rather than to a locally invented one.
 */
export const SearchQuerySchema = z
  .strictObject({
    bedrooms: commaSeparatedWholeNumbers('bedrooms').optional(),
    minPrice: wholeEuros('minPrice').optional(),
    maxPrice: wholeEuros('maxPrice').optional(),
    availability: z.enum(AVAILABILITY_SCOPES).optional(),
  })
  .superRefine((query, ctx) => {
    // Each bound is independently optional, so this only applies when both are given.
    if (
      query.minPrice !== undefined &&
      query.maxPrice !== undefined &&
      query.minPrice > query.maxPrice
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'minPrice must not exceed maxPrice',
        path: ['minPrice'],
      });
    }
  })
  .transform(
    (query): FilterState => ({
      ...DEFAULT_FILTER_STATE,
      ...(query.bedrooms === undefined ? {} : { bedrooms: query.bedrooms }),
      price: {
        min: query.minPrice ?? null,
        max: query.maxPrice ?? null,
      },
      ...(query.availability === undefined ? {} : { availability: query.availability }),
    }),
  );

/** Results and facets travel together so the list and the filters cannot disagree. */
export const SearchResponseSchema = z.object({
  results: z.array(PropertySchema),
  facets: FacetsSchema,
  total: z.number().int().nonnegative(),
  rejectedRows: z.number().int().nonnegative(),
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
