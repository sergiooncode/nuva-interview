import type { SearchResponse } from '@yaya/contracts/search.ts';
import type { FilterState } from '@yaya/domain/filters.ts';
import type { PropertyRepository } from '@yaya/domain/repository.ts';

/**
 * The one use case this service has. It is thin because there is nothing yet to
 * orchestrate — no authorization, no transaction spanning two stores, no side effect. It
 * exists as a named seam so that when there is, the route handler does not grow it.
 *
 * Results and facets arrive from a single repository call, so the list and the counts
 * cannot come from different reads.
 */
export const searchProperties = async (
  repository: PropertyRepository,
  filters: FilterState,
): Promise<SearchResponse> => {
  const { results, facets, total } = await repository.search(filters);
  return { results, facets, total, rejectedRows: repository.rejectedRows() };
};
