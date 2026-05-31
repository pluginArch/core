import type {
  CreatePluginInput,
  PluginIdParams,
  PluginModel,
  UpdatePluginInput,
} from '@pluginarch/models';
import type { FastifyInstance } from 'fastify';
import { MongoServerError } from 'mongodb';

const createPluginBodySchema = {
  type: 'object',
  required: ['pluginId', 'displayName', 'iconUrl', 'appUrl'],
  additionalProperties: false,
  properties: {
    pluginId: { type: 'string', minLength: 1 },
    displayName: { type: 'string', minLength: 1 },
    iconUrl: { type: 'string', minLength: 1 },
    appUrl: { type: 'string', minLength: 1 },
  },
} as const;

const updatePluginBodySchema = {
  type: 'object',
  required: ['displayName', 'iconUrl', 'appUrl'],
  additionalProperties: false,
  properties: {
    displayName: { type: 'string', minLength: 1 },
    iconUrl: { type: 'string', minLength: 1 },
    appUrl: { type: 'string', minLength: 1 },
  },
} as const;

const pluginParamsSchema = {
  type: 'object',
  required: ['pluginId'],
  additionalProperties: false,
  properties: {
    pluginId: { type: 'string', minLength: 1 },
  },
} as const;

function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return error instanceof MongoServerError && error.code === 11000;
}

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePluginInput }>('/plugins', {
    schema: {
      body: createPluginBodySchema,
    },
    handler: async (request, reply) => {
      const payload = request.body;
      const plugin: PluginModel = {
        pluginId: payload.pluginId,
        displayName: payload.displayName,
        iconUrl: payload.iconUrl,
        appUrl: payload.appUrl,
      };

      try {
        await fastify.pluginRegistryCollection.insertOne(plugin);
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          throw fastify.httpErrors.conflict(
            `Plugin with id '${payload.pluginId}' already exists.`,
          );
        }
        throw error;
      }

      return reply.code(201).send(plugin);
    },
  });

  fastify.get('/plugins', async () => {
    return fastify.pluginRegistryCollection
      .find({}, { projection: { _id: 0 } })
      .toArray();
  });

  fastify.get<{ Params: PluginIdParams }>('/plugins/:pluginId', {
    schema: {
      params: pluginParamsSchema,
    },
    handler: async (request) => {
      const plugin = await fastify.pluginRegistryCollection.findOne(
        { pluginId: request.params.pluginId },
        { projection: { _id: 0 } },
      );

      if (!plugin) {
        throw fastify.httpErrors.notFound(
          `Plugin with id '${request.params.pluginId}' was not found.`,
        );
      }

      return plugin;
    },
  });

  fastify.put<{ Params: PluginIdParams; Body: UpdatePluginInput }>(
    '/plugins/:pluginId',
    {
      schema: {
        params: pluginParamsSchema,
        body: updatePluginBodySchema,
      },
      handler: async (request) => {
        const updatedPlugin: PluginModel = {
          pluginId: request.params.pluginId,
          displayName: request.body.displayName,
          iconUrl: request.body.iconUrl,
          appUrl: request.body.appUrl,
        };

        const updateResult = await fastify.pluginRegistryCollection.findOneAndReplace(
          { pluginId: request.params.pluginId },
          updatedPlugin,
          { returnDocument: 'after', projection: { _id: 0 } },
        );

        if (!updateResult) {
          throw fastify.httpErrors.notFound(
            `Plugin with id '${request.params.pluginId}' was not found.`,
          );
        }

        return updateResult;
      },
    },
  );

  fastify.delete<{ Params: PluginIdParams }>('/plugins/:pluginId', {
    schema: {
      params: pluginParamsSchema,
    },
    handler: async (request, reply) => {
      const deleteResult = await fastify.pluginRegistryCollection.deleteOne({
        pluginId: request.params.pluginId,
      });

      if (!deleteResult.deletedCount) {
        throw fastify.httpErrors.notFound(
          `Plugin with id '${request.params.pluginId}' was not found.`,
        );
      }

      return reply.code(204).send();
    },
  });
}