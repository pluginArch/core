import { FastifyInstance } from 'fastify';

export default async function (fastify: FastifyInstance) {
  fastify.get('/', {
    schema: {
      tags: ['health'],
      operationId: 'getRegistryHealth',
      summary: 'Health check endpoint',
      response: {
        200: {
          type: 'object',
          required: ['message'],
          additionalProperties: false,
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
    handler: async function () {
      return { message: 'registry api is running' };
    },
  });
}
