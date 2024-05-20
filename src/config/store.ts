import { store } from '@davstack/store'
import browser from 'webextension-polyfill'
import { createJSONStorage, StateStorage } from 'zustand/middleware'

import { defaultConfig } from '@/config/defaultConfig'

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
      storage: createJSONStorage(() => webextStorage),
    },
  })
