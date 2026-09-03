import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from '@yaya/domain/__fixtures__/properties.ts';
import { SearchResponseSchema } from '@yaya/contracts/search.ts';
import { buildServer } from './server.ts';

const server = () =>
  buildServer({
    properties: [...FIXTURE_PROPERTIES],
    rejected: [{ row: 4, reason: 'bedrooms: must be a whole number' }],
  });

describe('GET /api/properties', () => {
  it('returns the filtered results and the facets together', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?bedrooms=1',
    });

    expect(response.statusCode).toBe(200);
    const body = SearchResponseSchema.parse(response.json());
    expect(body.total).toBe(2);
    expect(body.results.map((property) => property.id)).toEqual(['fx_03', 'fx_04']);
    // Facets ignore the bedroom selection, so every option still carries its count.
    expect(body.facets.bedrooms).toHaveLength(5);
    expect(body.rejectedRows).toBe(1);
  });

  it('widens the scope past available when asked', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?availability=all',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ total: number }>().total).toBe(FIXTURE_PROPERTIES.length);
  });

  it('rejects an unknown query parameter by name', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?bedroom=1',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      error: 'Invalid query parameter',
      field: 'bedroom',
    });
  });

  it('rejects a bedroom value that is not a whole number', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?bedrooms=dos',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ field: string }>().field).toContain('bedrooms');
  });
});

describe('GET /api/properties — price', () => {
  it('filters by an inclusive euro range and reports it back in cents', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?minPrice=1180&maxPrice=1260',
    });

    expect(response.statusCode).toBe(200);
    const body = SearchResponseSchema.parse(response.json());
    expect(body.results.map((property) => property.id)).toEqual(['fx_03', 'fx_04']);
    expect(body.results[0].monthlyRent).toBe(118000);
  });

  it('accepts a lower bound with no upper bound', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?minPrice=2000',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json<{ total: number }>().total).toBe(1);
  });

  it('ANDs the price range with the bedroom dimension', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?bedrooms=1,2&minPrice=1250',
    });

    const body = SearchResponseSchema.parse(response.json());
    expect(body.results.map((property) => property.id)).toEqual(['fx_04', 'fx_05']);
    // Each dimension's facet still ignores its own selection, so both stay full.
    expect(body.facets.bedrooms).toHaveLength(5);
    expect(body.facets.price).toHaveLength(7);
  });

  it('rejects a price that is not a whole number of euros', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?minPrice=1180.50',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ field: string }>().field).toBe('minPrice');
  });

  it('rejects a minimum above the maximum', async () => {
    const response = await server().inject({
      method: 'GET',
      url: '/api/properties?minPrice=2000&maxPrice=1000',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json<{ field: string }>().field).toBe('minPrice');
  });
});
