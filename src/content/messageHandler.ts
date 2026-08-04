import { BackgroundMessages, BackgroundMessageType } from '@/background/backgroundMessages'
import { disableTab, enableTab } from '@/content/content.ts'
import { contentConfig } from '@/content/contentStore'

export function messageHandler(message: BackgroundMessages) {
  logger.debug('[Content] Message received', message)
  switch (message.type) {
    case BackgroundMessageType.Enable:
      enableTab()
      return
    case BackgroundMessageType.Disable:
      disableTab()
      return
    case BackgroundMessageType.Config:
      contentConfig.set(message.config)
      return
  }
}
