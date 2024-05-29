import { dict } from '@/background'
import { backgroundStore, configStore } from '@/background/config/store'
import {
  ContentMessageHandler,
  ContentMessageType,
} from '@/content/contentMessages'

// Handles incoming messages from the content script
export const messageHandler: ContentMessageHandler = (
  message,
  sender,
  sendResponse
) => {
  logger.debug('[Background] Received message', message, sender)

  switch (message.type) {
    case ContentMessageType.Initialize:
      sendResponse({
        config: configStore.content.get(),
        enabled: backgroundStore.isEnabled.get(),
      })
      return
    case ContentMessageType.Search:
      const result = dict.search(message.text)
      if (result?.entries.length) sendResponse(result)
      return
    // case 'makehtml':
    //   return this.dict.makeHtml(message.entry)
    // case 'copyToClip':
    //   this.copyToClip(sender.tab, message.entry)
    //   return
    // case 'config':
    //           // Immediately update settings upon change occuring
    //           this.config = Object.assign(this.config, message.config);
    //           break;
    // case 'toggleDefinition':
    //   this.dict.toggleDefinition()
    //   break
    // case 'rebuild':
    //   this.dict.loadDictionary()
    //   break
    // case 'customstyling':
    //   response(this.config.content.popup.customStyling)
    //   break
    // case 'notepad':
    //   if (message.load) {
    //     response(this.config.content.notepad)
    //   } else {
    //     await browser.storage.sync.set({ notepad: message.query })
    //     this.config.content.notepad = message.query
    //   }
    //   break
    // case 'SIGN_CONNECT':
    //   break
    default:
      logger.error('Background received unknown request: ', message)
  }
}
