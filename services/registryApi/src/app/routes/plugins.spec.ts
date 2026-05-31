import type { PluginModel } from '@pluginarch/models';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import type { Collection } from 'mongodb';
import { MongoServerError } from 'mongodb';
import pluginRoutes from './plugins.js';

type PluginRecord = PluginModel;

function createCollectionStub(initialData: PluginRecord[] = []) {
  const records = new Map(
    initialData.map((plugin) => [plugin.pluginId, plugin]),
  );

  return {
    insertOne: async (plugin: PluginRecord) => {
      if (records.has(plugin.pluginId)) {
        throw new MongoServerError({
          message: 'duplicate key',
          errmsg: 'duplicate key',
          code: 11000,
        });
      }

      records.set(plugin.pluginId, plugin);
      return { acknowledged: true };
    },
    find: () => ({
      toArray: async () => Array.from(records.values()),
    }),
    findOne: async (query: { pluginId: string }) => {
      return records.get(query.pluginId) ?? null;
    },
    findOneAndReplace: async (
      query: { pluginId: string },
      plugin: PluginRecord,
    ) => {
      if (!records.has(query.pluginId)) {
        return null;
      }

      records.set(query.pluginId, plugin);
      return plugin;
    },
    deleteOne: async (query: { pluginId: string }) => {
      const deleted = records.delete(query.pluginId);
      return { deletedCount: deleted ? 1 : 0 };
    },
  };
}

describe('plugins routes', () => {
  it('creates and retrieves a plugin', async () => {
    const fastify = Fastify();
    await fastify.register(sensible);

    fastify.decorate(
      'pluginRegistryCollection',
      createCollectionStub() as unknown as Collection<PluginModel>,
    );

    await fastify.register(pluginRoutes);

    const payload = {
      pluginId: 'plugin-1',
      displayName: 'Plugin One',
      iconUrl: 'https://example.com/icon.png',
      appUrl: 'https://example.com/plugin',
    };

    const createResponse = await fastify.inject({
      method: 'POST',
      url: '/plugins',
      payload,
    });

    expect(createResponse.statusCode).toBe(201);

    const listResponse = await fastify.inject({
      method: 'GET',
      url: '/plugins',
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toEqual([payload]);

    await fastify.close();
  });

  it('returns 409 on duplicate plugin IDs', async () => {
    const existingPlugin = {
      pluginId: 'plugin-1',
      displayName: 'Plugin One',
      iconUrl: 'https://example.com/icon.png',
      appUrl: 'https://example.com/plugin',
    };

    const fastify = Fastify();
    await fastify.register(sensible);

    fastify.decorate(
      'pluginRegistryCollection',
      createCollectionStub([
        existingPlugin,
      ]) as unknown as Collection<PluginModel>,
    );

    await fastify.register(pluginRoutes);

    const response = await fastify.inject({
      method: 'POST',
      url: '/plugins',
      payload: existingPlugin,
    });

    expect(response.statusCode).toBe(409);

    await fastify.close();
  });

  it('returns 404 when reading a missing plugin', async () => {
    const fastify = Fastify();
    await fastify.register(sensible);

    fastify.decorate(
      'pluginRegistryCollection',
      createCollectionStub() as unknown as Collection<PluginModel>,
    );

    await fastify.register(pluginRoutes);

    const response = await fastify.inject({
      method: 'GET',
      url: '/plugins/missing-id',
    });

    expect(response.statusCode).toBe(404);

    await fastify.close();
  });
});
