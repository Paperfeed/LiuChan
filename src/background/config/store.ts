import { store } from '@davstack/store'
import browser from 'webextension-polyfill'

import { defaultConfig } from '@/background/config/defaultConfig'
import { loadConfig, saveConfig } from '@/background/config/initConfig'

export const configStore = store().state(defaultConfig)
export const backgroundStore = store().state({ isEnabled: true })

let configInitialization: Promise<void> | undefined
let persistenceRegistered = false

export function initializeConfig() {
  configInitialization ??= (async () => {
    configStore.set(await loadConfig())
    if (!persistenceRegistered) {
      persistenceRegistered = true
      configStore.onChange((state) => void saveConfig(state))
    }
  })()
  return configInitialization
}

const ENABLED_KEY = 'liuchan-enabled'
let enabledInitialization: Promise<void> | undefined

export function initializeEnabledState() {
  enabledInitialization ??= (async () => {
    const stored = await browser.storage.local.get(ENABLED_KEY)
    const enabled = stored[ENABLED_KEY]
    backgroundStore.isEnabled.set(typeof enabled === 'boolean' ? enabled : true)
  })()
  return enabledInitialization
}

export async function persistEnabledState(enabled: boolean) {
  backgroundStore.isEnabled.set(enabled)
  await browser.storage.local.set({ [ENABLED_KEY]: enabled })
}
