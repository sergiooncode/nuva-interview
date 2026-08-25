import { SearchResponseSchema, type SearchResponse } from '../api/contract.ts';
import { DEFAULT_FILTER_STATE, type FilterState } from '../domain/filters.ts';

const toQueryString = (filters: FilterState): string => {
  const params = new URLSearchParams();
  if (filters.bedrooms.length > 0) {
    params.set('bedrooms', filters.bedrooms.join(','));
  }
  if (filters.price.min !== null) {
    params.set('minPrice', String(Math.round(filters.price.min / 100)));
  }
  if (filters.price.max !== null) {
    params.set('maxPrice', String(Math.round(filters.price.max / 100)));
  }
  if (filters.availability !== DEFAULT_FILTER_STATE.availability) {
    params.set('availability', filters.availability);
  }
  return params.toString();
};

export const fetchProperties = async (filters: FilterState): Promise<SearchResponse> => {
  const query = toQueryString(filters);
  const response = await fetch(`/api/properties${query === '' ? '' : `?${query}`}`);
  if (!response.ok) {
    throw new Error(`La búsqueda ha fallado (${String(response.status)})`);
  }
  const body: unknown = await response.json();
  return SearchResponseSchema.parse(body);
};
