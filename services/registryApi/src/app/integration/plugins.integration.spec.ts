import type { PluginModel } from '@pluginarch/models';
import Fastify from 'fastify';
import type { AddressInfo } from 'node:net';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { app } from '../app';

describe('registryApi integration', () => {
  let mongoServer: MongoMemoryServer;
  let server: ReturnType<typeof Fastify>;
  let baseUrl = '';

  const originalMongoUri = process.env.MONGODB_URI;
  const originalMongoDb = process.env.MONGODB_DB;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();

    process.env.MONGODB_URI = mongoServer.getUri();
    process.env.MONGODB_DB = `registryapi_integration_${Date.now()}`;

    server = Fastify({ logger: false });
    await server.register(app);
    await server.listen({ host: '127.0.0.1', port: 0 });

    const address = server.server.address() as AddressInfo | null;
    if (!address || typeof address === 'string') {
      throw new Error('Failed to resolve integration test server address.');
    }

    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterAll(async () => {
    await server.close();
    await mongoServer.stop();

    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }

    if (originalMongoDb === undefined) {
      delete process.env.MONGODB_DB;
    } else {
      process.env.MONGODB_DB = originalMongoDb;
    }
  });

  it('supports full CRUD over real HTTP', async () => {
    const createdPayload: PluginModel = {
      pluginId: 'plugin-e2e-1',
      displayName: 'Plugin E2E One',
      iconUrl: 'https://example.com/icon-e2e-1.png',
      appUrl: 'https://example.com/app-e2e-1',
    };

    const createResponse = await fetch(`${baseUrl}/plugins`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(createdPayload),
    });

    expect(createResponse.status).toBe(201);
    expect(await createResponse.json()).toEqual(createdPayload);

    const getResponse = await fetch(
      `${baseUrl}/plugins/${createdPayload.pluginId}`,
    );
    expect(getResponse.status).toBe(200);
    expect(await getResponse.json()).toEqual(createdPayload);

    const listResponse = await fetch(`${baseUrl}/plugins`);
    expect(listResponse.status).toBe(200);
    expect(await listResponse.json()).toEqual([createdPayload]);

    const updatedPayload = {
      displayName: 'Plugin E2E One Updated',
      iconUrl: 'https://example.com/icon-e2e-updated.png',
      appUrl: 'https://example.com/app-e2e-updated',
    };

    const updateResponse = await fetch(
      `${baseUrl}/plugins/${createdPayload.pluginId}`,
      {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(updatedPayload),
      },
    );

    expect(updateResponse.status).toBe(200);
    expect(await updateResponse.json()).toEqual({
      pluginId: createdPayload.pluginId,
      ...updatedPayload,
    });

    const deleteResponse = await fetch(
      `${baseUrl}/plugins/${createdPayload.pluginId}`,
      {
        method: 'DELETE',
      },
    );

    expect(deleteResponse.status).toBe(204);

    const getDeletedResponse = await fetch(
      `${baseUrl}/plugins/${createdPayload.pluginId}`,
    );
    expect(getDeletedResponse.status).toBe(404);
  });

  it('serves openapi.json from a running API instance', async () => {
    const openapiResponse = await fetch(`${baseUrl}/openapi.json`);

    expect(openapiResponse.status).toBe(200);

    const openapi = (await openapiResponse.json()) as {
      openapi?: string;
      paths?: Record<string, unknown>;
    };

    expect(openapi.openapi).toBe('3.0.3');
    expect(openapi.paths).toHaveProperty('/plugins');
    expect(openapi.paths).toHaveProperty('/plugins/{pluginId}');
  });

  it('supports searching plugins by displayName over real HTTP', async () => {
    const pluginOne: PluginModel = {
      pluginId: 'plugin-search-1',
      displayName: 'Calendar Integrations',
      iconUrl: 'https://example.com/calendar.png',
      appUrl: 'https://example.com/calendar',
    };

    const pluginTwo: PluginModel = {
      pluginId: 'plugin-search-2',
      displayName: 'Weather Hub',
      iconUrl: 'https://example.com/weather.png',
      appUrl: 'https://example.com/weather',
    };

    await fetch(`${baseUrl}/plugins`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pluginOne),
    });

    await fetch(`${baseUrl}/plugins`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pluginTwo),
    });

    const allPluginsResponse = await fetch(`${baseUrl}/plugins`);
    expect(allPluginsResponse.status).toBe(200);
    const allPlugins = (await allPluginsResponse.json()) as PluginModel[];
    const allPluginIds = allPlugins.map((plugin) => plugin.pluginId);

    expect(allPluginIds).toEqual(
      expect.arrayContaining([pluginOne.pluginId, pluginTwo.pluginId]),
    );

    const filteredResponse = await fetch(`${baseUrl}/plugins?search=calendar`);
    expect(filteredResponse.status).toBe(200);

    const filteredPlugins = (await filteredResponse.json()) as PluginModel[];
    expect(filteredPlugins).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ pluginId: pluginOne.pluginId }),
      ]),
    );
    expect(filteredPlugins).toHaveLength(1);

    const emptySearchResponse = await fetch(
      `${baseUrl}/plugins?search=${encodeURIComponent('   ')}`,
    );
    expect(emptySearchResponse.status).toBe(400);
    expect(await emptySearchResponse.json()).toEqual({
      message: 'search must not be empty when provided.',
    });
  });
});
