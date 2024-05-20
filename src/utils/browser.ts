import browser, { Action, Tabs } from 'webextension-polyfill'
import SetIconDetailsType = Action.SetIconDetailsType
import SendMessageOptionsType = Tabs.SendMessageOptionsType

export async function sendMessageToAllTabs(message: any) {
  const windows = await browser.windows.getAll({ populate: true })

  windows.forEach((window) => {
    window.tabs?.forEach((tab) => {
      if (!tab.id) {
        console.error('No tab found')
        return
      }
      browser.tabs.sendMessage(tab.id, message)
    })
  })
}

export async function setIcon(icon: SetIconDetailsType) {
  if (__BROWSER__ === 'firefox') {
    await browser.browserAction.setIcon(icon)
  } else {
    await browser.action.setIcon(icon)
  }
}

export async function getCurrentTab() {
  const currentTabs = await browser.tabs.query({
    active: true,
    currentWindow: true,
  })
  return currentTabs[0]
}

// TODO: Add typing for messages
export async function sendTabMessage(
  tabId: number | undefined,
  message: any,
  options?: SendMessageOptionsType
) {
  if (!tabId) {
    logger.error('Tab id is not defined')
    return
  }
  return browser.tabs.sendMessage(tabId, message, options)
}

export function sendRuntimeMessage(
  message: any,
  options?: SendMessageOptionsType
) {
  logger.log('[CONTENT]Sending RuntimeMessage', message, options)
  return browser.runtime.sendMessage(message, options)
}
