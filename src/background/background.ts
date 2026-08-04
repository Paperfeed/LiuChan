import '@/utils/logger.ts'

import { BackgroundMessageType } from '@/background/backgroundMessages.ts'
import {
  backgroundStore,
  configStore,
  initializeConfig,
  initializeEnabledState,
  persistEnabledState,
} from '@/background/config/store.ts'
import { getDownloadedDictionaries } from '@/background/dictionaryData'
import { Dictionary } from '@/background/Dictionary.ts'
import { messageHandler } from '@/background/messageHandler.ts'
import { sendMessageToAllTabs, setIcon } from '@/utils/browser.ts'
import { toolbarIcon } from '@/utils/icons.ts'

export const dict = new Dictionary()
let dictionaryLoading: Promise<void> | undefined

async function registerDevelopmentContentScript() {
  if (
    !import.meta.env.DEV ||
    browser.runtime.getManifest().manifest_version !== 3
  )
    return
  const scripting = (browser as any).scripting
  if (!scripting) return
  const id = 'wxt:content-scripts/content.js'
  const existing = await scripting.getRegisteredContentScripts({ ids: [id] })
  if (existing.length) return
  await scripting.registerContentScripts([
    {
      allFrames: true,
      id,
      js: ['content-scripts/content.js'],
      matches: ['<all_urls>'],
      persistAcrossSessions: false,
      runAt: 'document_idle',
    },
  ])
  const tabs = await browser.tabs.query({ url: ['http://localhost/*'] })
  await Promise.all(
    tabs.flatMap((tab) => (tab.id ? [browser.tabs.reload(tab.id)] : []))
  )
}

export async function ensureDictionaryLoaded() {
  dictionaryLoading ??= dict
    .ensureLoaded(await getDownloadedDictionaries())
    .catch((error) => {
      dictionaryLoading = undefined
      throw error
    })
  return dictionaryLoading
}

export async function reloadDictionary() {
  dict.unloadDictionary()
  dictionaryLoading = undefined
  await ensureDictionaryLoaded()
}

export async function backgroundMain() {
  browser.runtime.onMessage.addListener(messageHandler)
  browser.action.onClicked.addListener(toggleExtension)

  await registerDevelopmentContentScript()

  await Promise.all([initializeConfig(), initializeEnabledState()])
  configStore.onChange((state, previous) => {
    sendMessageToAllTabs({ config: state, type: BackgroundMessageType.Config })
    if (state.dictionary !== previous.dictionary) void reloadDictionary()
  })

  if (backgroundStore.isEnabled.get()) await enableExtension(false)
  else await setIcon({ path: toolbarIcon.disabled })
}

export async function toggleExtension() {
  if (backgroundStore.isEnabled.get()) await disableExtension()
  else await enableExtension()
}

export async function enableExtension(notifyTabs = true) {
  await ensureDictionaryLoaded()
  await persistEnabledState(true)
  await setIcon({ path: toolbarIcon.enabled })
  if (notifyTabs) {
    await sendMessageToAllTabs({ type: BackgroundMessageType.Enable })
  }
}

export async function disableExtension() {
  await persistEnabledState(false)
  await setIcon({ path: toolbarIcon.disabled })
  await sendMessageToAllTabs({ type: BackgroundMessageType.Disable })
}
