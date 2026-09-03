import type { Facets } from './facets.ts';
import type { FilterState } from './filters.ts';
import type { Property } from './property.ts';

/**
 * Results and facets are produced by a single call, never two. A repository is free to
 * satisfy them from one snapshot or one transaction, but it may not let the list and the
 * counts come from different reads — that is the disagreement the combined response
 * exists to prevent, and it has to be guaranteed here rather than hoped for above.
 */
export type SearchOutcome = {
  results: Property[];
  facets: Facets;
  total: number;
};

/**
 * The port. `FilterState` is a query specification, not a predicate over an array, so an
 * adapter is free to evaluate it however it likes — a pass over memory, or SQL. Both
 * exist, and `search-equivalence.test.ts` asserts they agree.
 */
export type PropertyRepository = {
  search: (filters: FilterState) => Promise<SearchOutcome>;

  /** Rows refused at load time, so bad data stays visible instead of silently missing. */
  rejectedRows: () => number;

  /** Rejects when the backing store cannot serve traffic. Drives `/ready`. */
  verifyReadiness: () => Promise<void>;
};
