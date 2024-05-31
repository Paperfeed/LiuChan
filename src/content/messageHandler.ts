import {
  BackgroundMessageHandler,
  BackgroundMessageType,
} from '@/background/backgroundMessages'
import { disableTab, enableTab } from '@/content/content.ts'
import { contentConfig } from '@/content/contentStore'

// Handles incoming messages from the background script
export const messageHandler: BackgroundMessageHandler = (
  message,
  sender,
  sendResponse
) => {
  logger.debug('[Content] Message received', message, sender)

  switch (message.type) {
    case BackgroundMessageType.Initialize:
      contentConfig.set({
        ...contentConfig.get(),
        ...message.config,
      })
      if (message.enabled) {
        enableTab()
      }
      return
    case BackgroundMessageType.Enable:
      enableTab()
      return
    case BackgroundMessageType.Disable:
      disableTab()
      return
    case BackgroundMessageType.Config:
      logger.log('[Content] Received updated config:', message.config)
      contentConfig.set({
        ...contentConfig.get(),
        ...message.config,
      })
      return
    // case 'showPopup':
    //   this.popup.showPopup(message.text)
    //   break
    // case 'notepad':
    //   if (this.notepad) {
    //     this.notepad.toggleOverlay()
    //   } else {
    //     this.notepad = new Notepad(this.config.notepad)
    //   }
    //   break
    // case 'update':
    //   if (this.notepad) {
    //     this.notepad.updateState(message.notepad)
    //   }
    //   break
    case BackgroundMessageType.Heartbeat:
      enableTab()
      // if (this.config.displayHelp) {
      //   this.popup.showPopup(this.helpToolTip)
      // }
      sendResponse({ alive: true })
      return
    default:
      logger.error('Content script received unknown request: ', message)
  }
}
