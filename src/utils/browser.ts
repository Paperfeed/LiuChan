import browser, { Action, Runtime, Tabs } from 'webextension-polyfill'
import SetIconDetailsType = Action.SetIconDetailsType
import SendMessageOptionsType = Tabs.SendMessageOptionsType
import RuntimeSendMessageOptionsType = Runtime.SendMessageOptionsType
import { BackgroundMessages } from '@/background/backgroundMessages.ts'
import { ContentMessages, ContentResponse } from '@/content/contentMessages.ts'

export async function sendMessageToAllTabs(message: BackgroundMessages) {
  logger.debug('[Background] Sending Message to All Tabs', message)
  const windows = await browser.windows.getAll({ populate: true })

  windows.forEach((window) => {
    window.tabs?.forEach((tab) => {
      if (!tab.id) {
        logger.error('No tab found')
        return
      }
      browser.tabs
        .sendMessage(tab.id, message)
        .catch((error) => logger.debug("Tab doesn't accept messages", error))
    })
  })
}

export async function setIcon(icon: SetIconDetailsType) {
  if (getCurrentBrowser() === 'firefox') {
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

export async function sendTabMessage(
  tabId: number | undefined,
  message: BackgroundMessages,
  options?: SendMessageOptionsType
) {
  logger.debug('[Background] Sending Message to Tab', message, options)
  if (!tabId) {
    throw new Error('Tab id is not defined')
  }
  return browser.tabs.sendMessage(tabId, message, options)
}

export function sendRuntimeMessage<T extends ContentMessages>(
  message: T,
  options?: RuntimeSendMessageOptionsType
): Promise<ContentResponse<T['type']>> {
  logger.debug('[Content] Sending RuntimeMessage', message, options)
  return browser.runtime.sendMessage(message, options)
}

export function getCurrentBrowser() {
  return (import.meta.env.BROWSER as 'chrome' | 'firefox') ?? 'chrome'
}
