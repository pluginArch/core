import type {
  CreatePluginInput,
  PluginIdParams,
  PluginModel,
  UpdatePluginInput,
} from '@pluginarch/models';
import type { FastifyInstance } from 'fastify';

const pluginModelSchema = {
  type: 'object',
  required: ['pluginId', 'displayName', 'iconUrl', 'appUrl'],
  additionalProperties: false,
  properties: {
    pluginId: { type: 'string' },
    displayName: { type: 'string' },
    iconUrl: { type: 'string', format: 'uri' },
    appUrl: { type: 'string', format: 'uri' },
  },
} as const;

const pluginListSchema = {
  type: 'array',
  items: pluginModelSchema,
} as const;

const messageErrorSchema = {
  type: 'object',
  required: ['message'],
  additionalProperties: false,
  properties: {
    message: { type: 'string' },
  },
} as const;

const createPluginBodySchema = {
  type: 'object',
  required: ['pluginId', 'displayName', 'iconUrl', 'appUrl'],
  additionalProperties: false,
  properties: {
    pluginId: { type: 'string', minLength: 1 },
    displayName: { type: 'string', minLength: 1 },
    iconUrl: {
      type: 'string',
      minLength: 1,
      format: 'uri',
      pattern: '^https?://.+',
    },
    appUrl: {
      type: 'string',
      minLength: 1,
      format: 'uri',
      pattern: '^https?://.+',
    },
  },
} as const;

const updatePluginBodySchema = {
  type: 'object',
  required: ['displayName', 'iconUrl', 'appUrl'],
  additionalProperties: false,
  properties: {
    displayName: { type: 'string', minLength: 1 },
    iconUrl: {
      type: 'string',
      minLength: 1,
      format: 'uri',
      pattern: '^https?://.+',
    },
    appUrl: {
      type: 'string',
      minLength: 1,
      format: 'uri',
      pattern: '^https?://.+',
    },
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

function isDuplicateKeyError(error: unknown): boolean {
  const code = (error as { code?: number | string } | null | undefined)?.code;
  return code === 11000 || code === '11000';
}

function isValidHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export default async function (fastify: FastifyInstance) {
  fastify.post<{ Body: CreatePluginInput }>('/plugins', {
    schema: {
      tags: ['plugins'],
      operationId: 'createPlugin',
      summary: 'Create a plugin record',
      body: createPluginBodySchema,
      response: {
        201: pluginModelSchema,
        400: messageErrorSchema,
        409: messageErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const payload = request.body;

      if (!isValidHttpUrl(payload.iconUrl) || !isValidHttpUrl(payload.appUrl)) {
        return reply.code(400).send({
          message: 'iconUrl and appUrl must be valid HTTP(S) URLs.',
        });
      }

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
          return reply.code(409).send({
            message: `Plugin with id '${payload.pluginId}' already exists.`,
          });
        }
        throw error;
      }

      return reply.code(201).send(plugin);
    },
  });

  fastify.get('/plugins', {
    schema: {
      tags: ['plugins'],
      operationId: 'listPlugins',
      summary: 'List all plugin records',
      response: {
        200: pluginListSchema,
      },
    },
    handler: async () => {
      return fastify.pluginRegistryCollection
        .find({}, { projection: { _id: 0 } })
        .toArray();
    },
  });

  fastify.get<{ Params: PluginIdParams }>('/plugins/:pluginId', {
    schema: {
      tags: ['plugins'],
      operationId: 'getPluginById',
      summary: 'Get plugin by pluginId',
      params: pluginParamsSchema,
      response: {
        200: pluginModelSchema,
        404: messageErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const plugin = await fastify.pluginRegistryCollection.findOne(
        { pluginId: request.params.pluginId },
        { projection: { _id: 0 } },
      );

      if (!plugin) {
        return reply.code(404).send({
          message: `Plugin with id '${request.params.pluginId}' was not found.`,
        });
      }

      return plugin;
    },
  });

  fastify.put<{ Params: PluginIdParams; Body: UpdatePluginInput }>(
    '/plugins/:pluginId',
    {
      schema: {
        tags: ['plugins'],
        operationId: 'updatePluginById',
        summary: 'Replace plugin metadata by pluginId',
        params: pluginParamsSchema,
        body: updatePluginBodySchema,
        response: {
          200: pluginModelSchema,
          400: messageErrorSchema,
          404: messageErrorSchema,
        },
      },
      handler: async (request, reply) => {
        if (
          !isValidHttpUrl(request.body.iconUrl) ||
          !isValidHttpUrl(request.body.appUrl)
        ) {
          return reply.code(400).send({
            message: 'iconUrl and appUrl must be valid HTTP(S) URLs.',
          });
        }

        const updatedPlugin: PluginModel = {
          pluginId: request.params.pluginId,
          displayName: request.body.displayName,
          iconUrl: request.body.iconUrl,
          appUrl: request.body.appUrl,
        };

        const updateResult =
          await fastify.pluginRegistryCollection.findOneAndReplace(
            { pluginId: request.params.pluginId },
            updatedPlugin,
            { returnDocument: 'after', projection: { _id: 0 } },
          );

        if (!updateResult) {
          return reply.code(404).send({
            message: `Plugin with id '${request.params.pluginId}' was not found.`,
          });
        }

        return updateResult;
      },
    },
  );

  fastify.delete<{ Params: PluginIdParams }>('/plugins/:pluginId', {
    schema: {
      tags: ['plugins'],
      operationId: 'deletePluginById',
      summary: 'Delete plugin by pluginId',
      params: pluginParamsSchema,
      response: {
        204: { type: 'null', description: 'Plugin deleted.' },
        404: messageErrorSchema,
      },
    },
    handler: async (request, reply) => {
      const deleteResult = await fastify.pluginRegistryCollection.deleteOne({
        pluginId: request.params.pluginId,
      });

      if (!deleteResult.deletedCount) {
        return reply.code(404).send({
          message: `Plugin with id '${request.params.pluginId}' was not found.`,
        });
      }

      return reply.code(204).send();
    },
  });
}
