import type { PropertyRepository } from '@yaya/domain/repository.ts';
import type { FastifyInstance } from 'fastify';

/**
 * Liveness and readiness are different questions and get different endpoints.
 *
 * `/health` answers "is this process alive" — it touches no dependency, because a probe
 * that fails when the database is briefly unavailable gets the container killed and
 * restarted, which fixes nothing and loses the warm pool.
 *
 * `/ready` answers "should traffic be routed here", so it does check the store and
 * returns 503 while it cannot serve. That is the one a load balancer removes you on.
 */
export const registerHealthRoutes = (
  app: FastifyInstance,
  repository: PropertyRepository,
): void => {
  app.get('/health', (_request, reply) =>
    reply.send({ status: 'ok', uptimeSeconds: Math.floor(process.uptime()) }),
  );

  app.get('/ready', async (_request, reply) => {
    try {
      await repository.verifyReadiness();
      return await reply.send({ status: 'ready', rejectedRows: repository.rejectedRows() });
    } catch (error) {
      app.log.warn({ err: error }, 'Readiness check failed');
      return await reply.status(503).send({
        status: 'unready',
        reason: error instanceof Error ? error.message : 'Unknown',
      });
    }
  });
};
