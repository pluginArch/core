export const PLUGIN_COLLECTION_NAME = 'plugins';

export interface PluginModel {
  pluginId: string;
  displayName: string;
  iconUrl: string;
  appUrl: string;
}

export type CreatePluginInput = PluginModel;

export interface UpdatePluginInput {
  displayName: string;
  iconUrl: string;
  appUrl: string;
}

export interface PluginIdParams {
  pluginId: string;
}
