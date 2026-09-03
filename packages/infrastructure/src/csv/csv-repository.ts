import { computeFacets } from '@yaya/domain/facets.ts';
import { applyFilters, type FilterState } from '@yaya/domain/filters.ts';
import type { PropertyRepository, SearchOutcome } from '@yaya/domain/repository.ts';
import type { Catalogue } from './parse-catalogue.ts';

/**
 * The in-memory adapter. It is not a stepping stone to the SQL one — it is the oracle the
 * SQL one is checked against, and it is what lets the whole suite run without a database.
 */
export const createCsvPropertyRepository = (catalogue: Catalogue): PropertyRepository => ({
  search: (filters: FilterState): Promise<SearchOutcome> => {
    const results = applyFilters(catalogue.properties, filters, { except: null });
    return Promise.resolve({
      results,
      facets: computeFacets(catalogue.properties, filters),
      total: results.length,
    });
  },

  rejectedRows: () => catalogue.rejected.length,

  verifyReadiness: () =>
    catalogue.properties.length > 0
      ? Promise.resolve()
      : Promise.reject(new Error('Catalogue is empty')),
});
