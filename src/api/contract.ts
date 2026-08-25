import { z } from 'zod';
import { FacetsSchema } from '../domain/facets.ts';
import {
  AVAILABILITY_SCOPES,
  DEFAULT_FILTER_STATE,
  type FilterState,
} from '../domain/filters.ts';
import { PropertySchema } from '../domain/property.ts';

const commaSeparatedWholeNumbers = (field: string) =>
  z
    .string()
    .transform((raw) => raw.split(',').filter((part) => part !== ''))
    .pipe(z.array(z.string().regex(/^\d+$/, `${field} must be whole numbers`)))
    .transform((parts) => parts.map(Number));

/**
 * Strict: a typo'd filter name is a 400, not a silent unfiltered result. An absent
 * param falls back to the canonical default rather than to a locally invented one.
 */
export const SearchQuerySchema = z
  .strictObject({
    bedrooms: commaSeparatedWholeNumbers('bedrooms').optional(),
    availability: z.enum(AVAILABILITY_SCOPES).optional(),
  })
  .transform(
    (query): FilterState => ({
      ...DEFAULT_FILTER_STATE,
      ...(query.bedrooms === undefined ? {} : { bedrooms: query.bedrooms }),
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
