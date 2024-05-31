import '@/utils/logger.ts'

import { BackgroundMessageType } from '@/background/backgroundMessages.ts'
import { backgroundStore, configStore } from '@/background/config/store.ts'
import { Dictionary } from '@/background/Dictionary.ts'
import { messageHandler } from '@/background/messageHandler.ts'
import { sendMessageToAllTabs, setIcon } from '@/utils/browser.ts'
import { toolbarIcon } from '@/utils/icons.ts'

export const dict = new Dictionary()

export function backgroundMain() {
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
        config: state,
        type: BackgroundMessageType.Config,
      }).then(() => logger.log('Sent updated config to all tabs'))
    })

    // Todo remove this
    enableExtension()
  } catch (error) {
    logger.error('Error:', error)
  }
}

export async function toggleExtension() {
  if (backgroundStore.isEnabled.get()) {
    logger.log('Disabling Liuchan')
    await disableExtension()
  } else {
    logger.log('Enabling Liuchan')
    await enableExtension()
  }
}

export async function enableExtension() {
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
      config: config,
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
