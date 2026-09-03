import type { PropertyRepository } from '@yaya/domain/repository.ts';
import Fastify, { type FastifyInstance } from 'fastify';
import { registerHealthRoutes } from './routes/health.ts';
import { registerPropertyRoutes } from './routes/properties.ts';

export type ServerOptions = {
  repository: PropertyRepository;
  logLevel?: string;
};

export const buildServer = ({ repository, logLevel }: ServerOptions): FastifyInstance => {
  const app = Fastify({
    logger: logLevel === undefined ? false : { level: logLevel },
    // Trust the request id a proxy already assigned, so one trace spans the whole hop.
    requestIdHeader: 'x-request-id',
  });

  /**
   * The single place a failure becomes a status code. The request id goes out with the
   * body: a user reporting "it failed" hands over a string that finds the exact log line,
   * which is the difference between a report being actionable and being a shrug. The
   * stack stays on this side of the wire.
   */
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, 'Unhandled error');
    return reply.status(500).send({ error: 'Internal server error', requestId: request.id });
  });

  app.setNotFoundHandler((request, reply) =>
    reply.status(404).send({ error: 'Not found', requestId: request.id }),
  );

  registerHealthRoutes(app, repository);
  registerPropertyRoutes(app, repository);

  return app;
};
