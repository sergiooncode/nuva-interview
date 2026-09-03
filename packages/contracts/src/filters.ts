/**
 * The filter specification, which is genuinely shared: the client composes one, the
 * query string encodes one, and the search use case consumes one. Publishing the schema
 * rather than the shape means the client validates against the same refinement the
 * server enforces, instead of re-implementing "min must not exceed max" in a component.
 */
export {
  AVAILABILITY_SCOPES,
  DEFAULT_FILTER_STATE,
  FilterStateSchema,
  PriceRangeSchema,
  type AvailabilityScope,
  type FilterState,
  type PriceRange,
} from '@yaya/domain/filters.ts';
