import { searchProperties } from '@yaya/application/search-properties.ts';
import { SearchQuerySchema } from '@yaya/contracts/search.ts';
import { DomainError } from '@yaya/domain/errors.ts';
import type { PropertyRepository } from '@yaya/domain/repository.ts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

const offendingField = (error: z.ZodError): string => {
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') return issue.keys.join(', ');
    if (issue.path.length > 0) return issue.path.map(String).join('.');
  }
  return 'query';
};

export const registerPropertyRoutes = (
  app: FastifyInstance,
  repository: PropertyRepository,
): void => {
  app.get('/api/properties', async (request, reply) => {
    /**
     * `safeParse` is not total: a constructor that throws inside a `.transform()` escapes
     * it rather than becoming an issue, which would turn a bad parameter into a 500. The
     * schema keeps its inputs bounded so that cannot happen, and this catch makes the
     * guarantee hold even if a future transform forgets.
     */
    let filters;
    try {
      const query = SearchQuerySchema.safeParse(request.query);
      if (!query.success) {
        return await reply
          .status(400)
          .send({ error: 'Invalid query parameter', field: offendingField(query.error) });
      }
      filters = query.data;
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      return await reply.status(400).send({ error: error.message, field: 'query' });
    }

    return await reply.send(await searchProperties(repository, filters));
  });
};
