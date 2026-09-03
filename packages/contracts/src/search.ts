import { z } from 'zod';
import { FacetsSchema } from '@yaya/domain/facets.ts';
import {
  AVAILABILITY_SCOPES,
  DEFAULT_FILTER_STATE,
  type FilterState,
} from '@yaya/domain/filters.ts';
import { centsFromEuros } from '@yaya/domain/money.ts';
import { PropertySchema } from '@yaya/domain/property.ts';

const commaSeparatedWholeNumbers = (field: string) =>
  z
    .string()
    .transform((raw) => raw.split(',').filter((part) => part !== ''))
    .pipe(z.array(z.string().regex(/^\d+$/, `${field} must be whole numbers`)))
    .transform((parts) => parts.map(Number));

/** Prices travel the wire in whole euros, as api.md documents, and become cents here. */
const wholeEuros = (field: string) =>
  z
    .string()
    .regex(/^\d+$/, `${field} must be a whole number of euros`)
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
