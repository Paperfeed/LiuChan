import '@/utils/logger'

import browser from 'webextension-polyfill'

import { LiuChan } from '@/background/LiuChan'
import { configStore } from '@/config/store'
import { sendMessageToAllTabs } from '@/utils/browser'

const liuChan = new LiuChan()

try {
  browser.runtime.onInstalled.addListener((details) => {
    logger.log('Extension installed:', details)
  })

  browser.action.onClicked.addListener(liuChan.toggleExtension)
  // browser.action.onClicked.addListener(liuChan.toggleExtension)
  // browser.tabs.onActivated.addListener(liuChan.onActiveTabChange)
  // browser.windows.onFocusChanged.addListener(liuChan.onWindowChangeFocus)
  // browser.storage.onChanged.addListener(liuChan.onConfigChange)
  //
  browser.runtime.onMessage.addListener(liuChan.messageHandler)

  configStore.onChange((state) => {
    console.log('state', state)
    sendMessageToAllTabs({ config: state.content, type: 'config' })
  })

  // setInterval(() => {
  //   configStore.content.disableKeys.set(!configStore.content.disableKeys.get())
  // }, 2000)
} catch (error) {
  logger.error('Error:', error)
}
