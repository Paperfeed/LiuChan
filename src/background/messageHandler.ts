import {
  backgroundStore,
  configStore,
  initializeConfig,
  initializeEnabledState,
} from '@/background/config/store'
import {
  getDictionaryMetadata,
  restoreBundledDictionaries,
  updateDictionaries,
} from '@/background/dictionaryData'
import { ContentMessages, ContentMessageType } from '@/content/contentMessages'
import { speak } from '@/background/tts'

import { dict, ensureDictionaryLoaded, reloadDictionary } from './background'

export async function messageHandler(message: ContentMessages) {
  logger.debug('[Background] Received message', message)
  switch (message.type) {
    case ContentMessageType.Initialize:
      await Promise.all([initializeConfig(), initializeEnabledState()])
      return {
        config: configStore.get(),
        enabled: backgroundStore.isEnabled.get(),
      }
    case ContentMessageType.Search:
      await ensureDictionaryLoaded()
      return dict.search(message.text)
    case ContentMessageType.Config:
      configStore.set(message.config)
      return
    case ContentMessageType.Speak:
      return speak(
        message.text,
        configStore.ttsDialect.get(),
        configStore.ttsSpeed.get()
      )
    case ContentMessageType.DictionaryStatus:
      return getDictionaryMetadata()
    case ContentMessageType.DictionaryUpdate: {
      const metadata = await updateDictionaries()
      await reloadDictionary()
      return metadata
    }
    case ContentMessageType.DictionaryRestore:
      await restoreBundledDictionaries()
      await reloadDictionary()
      return
  }
}
