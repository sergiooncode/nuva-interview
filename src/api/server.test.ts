import { describe, expect, it } from 'vitest';
import { FIXTURE_PROPERTIES } from '../domain/__fixtures__/properties.ts';
import { SearchResponseSchema } from './contract.ts';
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
