import { store } from '@davstack/store'
import browser from 'webextension-polyfill'
import { createJSONStorage, StateStorage } from 'zustand/middleware'

import {
  CURRENT_CONFIG_VERSION,
  defaultConfig,
} from '@/background/config/defaultConfig'
import { migrateConfig } from '@/background/config/initConfig'

const webextStorage: StateStorage = {
  getItem: async (name) => {
    const result = await browser.storage.sync.get(name)
    return result[name] ? JSON.stringify(result[name]) : null
  },
  removeItem: async (name) => {
    await browser.storage.sync.remove(name)
  },
  setItem: async (name, value) => {
    const jsonValue = JSON.parse(value)
    await browser.storage.sync.set({ [name]: jsonValue })
  },
}

export const configStore = store()
  .state(defaultConfig)
  .options({
    name: 'liuchan-config',
    persist: {
      enabled: true,
      migrate: migrateConfig,
      storage: createJSONStorage(() => webextStorage),
      version: CURRENT_CONFIG_VERSION,
    },
  })

export const backgroundStore = store().state({ isEnabled: false })
