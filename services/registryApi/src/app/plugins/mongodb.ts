import type { PluginModel } from '@pluginarch/models';
import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { type Collection, MongoClient } from 'mongodb';

const PLUGIN_COLLECTION_NAME = 'plugins';

declare module 'fastify' {
  interface FastifyInstance {
    pluginRegistryCollection: Collection<PluginModel>;
  }
}

export default fp(async function (fastify: FastifyInstance) {
  const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017';
  const databaseName = process.env.MONGODB_DB ?? 'pluginarch';

  const client = new MongoClient(mongoUri);
  await client.connect();

  const pluginRegistryCollection = client
    .db(databaseName)
    .collection<PluginModel>(PLUGIN_COLLECTION_NAME);

  await pluginRegistryCollection.createIndex(
    { pluginId: 1 },
    { unique: true, name: 'pluginId_unique' },
  );

  fastify.decorate('pluginRegistryCollection', pluginRegistryCollection);

  fastify.addHook('onClose', async () => {
    await client.close();
  });
});
