import Fastify, { type FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { Catalogue } from '../domain/csv.ts';
import { computeFacets } from '../domain/facets.ts';
import { applyFilters } from '../domain/filters.ts';
import { SearchQuerySchema, type SearchResponse } from './contract.ts';

const offendingField = (error: z.ZodError): string => {
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') return issue.keys.join(', ');
    if (issue.path.length > 0) return issue.path.map(String).join('.');
  }
  return 'query';
};

export const buildServer = (catalogue: Catalogue): FastifyInstance => {
  const app = Fastify();

  // The single place a failure becomes a status code; stack traces never leave here.
  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  });

  app.get('/api/properties', (request, reply) => {
    const query = SearchQuerySchema.safeParse(request.query);
    if (!query.success) {
      return reply.status(400).send({
        error: 'Invalid query parameter',
        field: offendingField(query.error),
      });
    }

    const filters = query.data;
    const results = applyFilters(catalogue.properties, filters, { except: null });
    const body: SearchResponse = {
      results,
      facets: computeFacets(catalogue.properties, filters),
      total: results.length,
      rejectedRows: catalogue.rejected.length,
    };
    return reply.send(body);
  });

  return app;
};
