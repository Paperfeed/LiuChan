import browser, { Tabs } from 'webextension-polyfill'

import { BackgroundMessageType } from '@/background/backgroundMessages'
import {
  CURRENT_CONFIG_VERSION,
  defaultConfig,
  LiuChanOptions,
} from '@/background/config/defaultConfig'
import {
  getCurrentTab,
  sendMessageToAllTabs,
  sendTabMessage,
  setIcon,
} from '@/utils/browser'
import { toolbarIcon } from '@/utils/icons'

import { Dictionary } from '../background/Dictionary'
import { Omnibox } from './Omnibox'
import OnActivatedActiveInfoType = Tabs.OnActivatedActiveInfoType

export class LiuChan {
  public config: LiuChanOptions
  public dict: Dictionary

  protected isEnabled: boolean
  private omnibox: Omnibox

  constructor() {
    this.isEnabled = false

    this.messageHandler = this.messageHandler.bind(this)
    this.onConfigChange = this.onConfigChange.bind(this)
    this.toggleExtension = this.toggleExtension.bind(this)
    this.onWindowChangeFocus = this.onWindowChangeFocus.bind(this)
    this.onTabSelect = this.onTabSelect.bind(this)

    this.config = defaultConfig

    this.initConfig()

    // Add contextMenu
    browser.contextMenus.create({
      contexts: ['browser_action'],
      id: 'notepad',
      title: 'Notepad',
    })

    browser.contextMenus.onClicked.addListener((info, tab) => {
      console.log(info, tab)
      // if (info.this.openNotepad,
    })

    // Set extension icon
    setIcon({
      path: toolbarIcon.disabled,
    })
  }

  onConfigChange(changes: object, areaName: string) {
    return sendMessageToAllTabs({
      config: this.config.content,
      enabled: this.isEnabled,
      type: BackgroundMessageType.Initialize,
    })
  }

  async onWindowChangeFocus(windowId: number) {
    if (windowId !== -1) {
      const currentTab = await getCurrentTab()
      if (!currentTab || currentTab.id === undefined) {
        console.error('No tab found')
        return
      }
      this.onTabSelect(currentTab.id)
    }
  }

  onActiveTabChange(activeInfo: OnActivatedActiveInfoType) {
    this.onTabSelect(activeInfo.tabId)
  }
  // The callback for chrome.tabs.onActivated
  // Sends a message to the tab to enable itself if it hasn't
  onTabSelect(tabId: number) {
    if (this.isEnabled) {
      browser.runtime.sendMessage(tabId, {
        config: this.config.content,
        type: 'enable',
      })
    }
    sendTabMessage(tabId, {
      notepad: this.config.content.notepad,
      type: 'update',
    })
  }

  async openNotepad() {
    const currentTab = await getCurrentTab()
    sendTabMessage(currentTab.id, { type: 'notepad' })
  }

  copyToClip(tab, entry) {
    if (entry.length === 0) return null

    let text = '',
      sep,
      end

    switch (this.config.copySeparator) {
      case 'tab':
        sep = '\t'
        break
      default:
        sep = this.config.copySeparator
    }

    switch (this.config.lineEnding) {
      case 'r':
        end = '\r'
        break
      case 'rn':
        end = '\r\n'
        break
      default:
        end = '\n'
    }

    // TODO support custom separator
    const pinyinType = this.config.pinyinType
    const maxLoops = Math.min(
      this.config.maxClipCopyEntries,
      entry[0].data.length
    )
    for (let i = 0; i < maxLoops; i++) {
      text +=
        entry[0].data[i].simp +
        sep +
        entry[0].data[i].trad +
        sep +
        entry[0].data[i].pinyin[pinyinType] +
        sep +
        entry[0].data[i].def.join('; ') +
        end
      //this.dict.parseDefinitions(entry[0].data[i].def).replace(/<\/?b>/g, "") + end;
    }

    document.oncopy = (event) => {
      event.clipboardData.setData('Text', text)
      event.preventDefault()
    }

    document.execCommand('Copy')

    document.oncopy = undefined
    sendTabMessage(tab.id, {
      text: '<div class="def">Copied to clipboard.</div>',
      type: 'showPopup',
    })
  }
}
