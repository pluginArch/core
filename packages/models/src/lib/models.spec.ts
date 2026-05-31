import { PLUGIN_COLLECTION_NAME } from './models.js';

describe('models', () => {
  it('should expose the plugin collection name', () => {
    expect(PLUGIN_COLLECTION_NAME).toEqual('plugins');
  });
});
