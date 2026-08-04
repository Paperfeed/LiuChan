import browser from 'webextension-polyfill'

import {
  CURRENT_CONFIG_VERSION,
  LiuChanOptions,
  sanitizeConfig,
} from '@/background/config/defaultConfig'

const CONFIG_KEY = 'liuchan-config'

export interface PersistedConfig {
  state: LiuChanOptions
  version: number
}

export async function loadConfig(): Promise<LiuChanOptions> {
  const stored = await browser.storage.sync.get(null)
  const persisted = stored[CONFIG_KEY] as Partial<PersistedConfig> | undefined
  const source = persisted?.state ?? stored
  const config = sanitizeConfig(source)

  await browser.storage.sync.set({
    [CONFIG_KEY]: { state: config, version: CURRENT_CONFIG_VERSION },
  })
  return config
}

export async function saveConfig(config: LiuChanOptions) {
  await browser.storage.sync.set({
    [CONFIG_KEY]: {
      state: sanitizeConfig(config),
      version: CURRENT_CONFIG_VERSION,
    } satisfies PersistedConfig,
  })
}

export async function migrateConfig(
  storedSettings: unknown,
  _version: number
): Promise<LiuChanOptions> {
  return sanitizeConfig(storedSettings)
}
