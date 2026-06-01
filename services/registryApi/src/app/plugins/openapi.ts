import swagger from '@fastify/swagger';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';

export default fp(async function (fastify: FastifyInstance) {
  await fastify.register(swagger, {
    openapi: {
      info: {
        title: 'PluginArch Registry API',
        description: 'CRUD API for plugin metadata in the PluginArch registry.',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server',
        },
      ],
      tags: [
        { name: 'health', description: 'Service health checks' },
        { name: 'plugins', description: 'Plugin registry operations' },
      ],
    },
  });

  fastify.get('/openapi.json', {
    schema: {
      hide: true,
    },
    handler: async (_request, reply) => {
      return reply.type('application/json').send(fastify.swagger());
    },
  });
});
