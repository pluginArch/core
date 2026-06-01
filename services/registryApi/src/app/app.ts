import { FastifyInstance } from 'fastify';
import mongodbPlugin from './plugins/mongodb';
import openapiPlugin from './plugins/openapi';
import sensiblePlugin from './plugins/sensible';
import pluginsRoutes from './routes/plugins';
import rootRoutes from './routes/root';

/* eslint-disable-next-line */
export interface AppOptions {}

export async function app(fastify: FastifyInstance, opts: AppOptions) {
  fastify.register(openapiPlugin, { ...opts });
  fastify.register(sensiblePlugin, { ...opts });
  fastify.register(mongodbPlugin, { ...opts });

  fastify.register(rootRoutes, { ...opts });
  fastify.register(pluginsRoutes, { ...opts });
}
