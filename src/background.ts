import '@/utils/logger'

import browser from 'webextension-polyfill'

import { BackgroundMessageType } from '@/background/backgroundMessages'
import { backgroundStore, configStore } from '@/background/config/store'
import { Dictionary } from '@/background/Dictionary'
import { messageHandler } from '@/background/messageHandler'
import { sendMessageToAllTabs, setIcon } from '@/utils/browser'
import { toolbarIcon } from '@/utils/icons'

export const dict = new Dictionary()

async function toggleExtension() {
  if (backgroundStore.isEnabled.get()) {
    logger.log('Disabling Liuchan')
    await disableExtension()
  } else {
    logger.log('Enabling Liuchan')
    await enableExtension()
  }
}

async function enableExtension() {
  // Check if the content script is actually running and let the user know the tab needs to be reloaded if not.
  const config = configStore.get()

  // TODO Fix fuzzysearch
  // this.omnibox = new Omnibox(this)
  // browser.omnibox.onInputChanged.addListener(this.omnibox.fuzzysearch)
  //browser.omnibox.onInputEntered.addListener(text => { //Do sth on enter });

  await dict.loadDictionary()

  backgroundStore.isEnabled.set(true)

  // Set extension icon
  await setIcon({
    path: toolbarIcon.enabled,
  })

  try {
    await sendMessageToAllTabs({
      config: config.content,
      enabled: true,
      type: BackgroundMessageType.Initialize,
    })
  } catch (e) {
    logger.error(e)
    await browser.notifications.create({
      iconUrl: '/icon/128.png',
      message:
        'Oops! You will need to reload this tab before Liuchan can work its ' +
        'magic! \n\nThis is only necessary on tabs that were open before Liuchan was installed or updated :)',
      title: 'Liuchan - Please reload this tab',
      type: 'basic',
    })
  }
}

async function disableExtension() {
  await sendMessageToAllTabs({ type: BackgroundMessageType.Disable })
  // browser.omnibox.onInputChanged.removeListener(this.omnibox.fuzzysearch)

  backgroundStore.isEnabled.set(false)
  dict.unloadDictionary()
  await setIcon({ path: toolbarIcon.disabled })
}

try {
  browser.runtime.onInstalled.addListener((details) => {
    logger.log('Extension installed:', details)
  })

  browser.runtime.onMessage.addListener(messageHandler)
  browser.action.onClicked.addListener(toggleExtension)
  // browser.action.onClicked.addListener(liuChan.toggleExtension)
  // browser.tabs.onActivated.addListener(liuChan.onActiveTabChange)
  // browser.windows.onFocusChanged.addListener(liuChan.onWindowChangeFocus)
  // browser.storage.onChanged.addListener(liuChan.onConfigChange)
  //
  // browser.runtime.onMessage.addListener(liuChan.messageHandler)

  configStore.onChange((state) => {
    sendMessageToAllTabs({
      config: state.content,
      type: BackgroundMessageType.Config,
    }).then(() => logger.log('Sent updated config to all tabs'))
  })

  // Todo remove this
  enableExtension()
} catch (error) {
  logger.error('Error:', error)
}
