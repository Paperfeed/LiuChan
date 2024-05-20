import browser, { Tabs } from 'webextension-polyfill'

import {
  getCurrentTab,
  sendMessageToAllTabs,
  sendTabMessage,
  setIcon,
} from '@/utils/browser'
import { toolbarIcon } from '@/utils/icons'

import { Dictionary } from './Dictionary'
import { Omnibox } from './Omnibox'
import OnActivatedActiveInfoType = Tabs.OnActivatedActiveInfoType
import {
  CURRENT_CONFIG_VERSION,
  defaultConfig,
  LiuChanOptions,
} from '@/config/defaultConfig'

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

  async initConfig() {
    let storedSettings = await browser.storage.sync.get(defaultConfig)
    // Ensure users don't lose their customized settings after updated where stuff has been changed around.
    if (storedSettings.version !== CURRENT_CONFIG_VERSION) {
      console.log(
        'Liuchan has been updated; Attempting to convert old settings'
      )
      // Get ALL items from storage and compare them to the default config, reassigning old values to
      // new keys where appropriate.
      const outdatedSettings = await browser.storage.sync.get(null)
      storedSettings = defaultConfig
      for (const key in outdatedSettings) {
        // if (!items.hasOwnProperty(key)) {console.log(key);} // for DEBUG purposes
        switch (key) {
          case 'showOnKey':
            const str = outdatedSettings.showOnKey
            if (str === 'Ctrl') {
              storedSettings.showOnKey = 1
            } else if (str === 'Alt') {
              storedSettings.showOnKey = 2
            } else if (str === 'CtrlAlt') {
              storedSettings.showOnKey = 3
            } else {
              storedSettings.showOnKey = 0
            }
            break
          case 'doColors':
            storedSettings.useHanziToneColors = outdatedSettings.doColors
            break
          case 'doPinyinColors':
            storedSettings.usePinyinToneColors = outdatedSettings.doPinyinColors
            break
          case 'miniHelp':
            storedSettings.displayHelp = outdatedSettings.miniHelp
            break
          case 'numdef':
            storedSettings.definitionSeparator = outdatedSettings.numdef
            break
          case 'pinyin':
            storedSettings.pinyinType = outdatedSettings.pinyin
            break
          case 'showHanzi':
            storedSettings.hanziType = outdatedSettings.showHanzi
            break
          case 'useCustomTone':
            storedSettings.useCustomTones = outdatedSettings.useCustomTone
            break
          default:
            if (Object.prototype.hasOwnProperty.call(storedSettings, key)) {
              storedSettings[key] = outdatedSettings[key]
            }
        }
        storedSettings.version = CURRENT_CONFIG_VERSION
        this.config = storedSettings as LiuChanOptions
      }
      // Empty storage to get rid of deprecated keys and save the new updated list
      await browser.storage.sync.clear()
      await browser.storage.sync.set(storedSettings)
      console.log('Successfully converted and saved settings!')
    } else {
      // Init any keys that don't exist yet with default values, then assign to LiuChan.config
      this.config = Object.assign(defaultConfig, storedSettings)
      await browser.storage.sync.set(this.config)
    }
  }

  async toggleExtension() {
    if (this.isEnabled) {
      logger.log('Disabling Liuchan')
      await this.disableExtension()
    } else {
      logger.log('Enabling Liuchan')
      await this.enableExtension()
    }
  }

  async disableExtension() {
    await sendMessageToAllTabs({ type: 'disable' })
    // browser.omnibox.onInputChanged.removeListener(this.omnibox.fuzzysearch)

    // Clean up memory
    this.isEnabled = false
    this.dict.unloadDictionary()
    await setIcon({ path: toolbarIcon.disabled })
    await browser.action.setBadgeBackgroundColor({ color: [0, 0, 0, 0] })
    await browser.action.setBadgeText({ text: '' })
  }

  async enableExtension() {
    // Check if the content script is actually running and let the user know the tab needs to be reloaded if not.
    const currentTab = await getCurrentTab()

    if (!this.dict) {
      try {
        this.dict = new Dictionary('data/cedict_ts.u8', this.config)
      } catch (e) {
        alert('Error loading dictionary: ' + e)
      }
    }

    // TODO Fix fuzzysearch
    // this.omnibox = new Omnibox(this)
    // browser.omnibox.onInputChanged.addListener(this.omnibox.fuzzysearch)
    //browser.omnibox.onInputEntered.addListener(text => { //Do sth on enter });

    await this.dict.loadDictionary()
    this.isEnabled = true

    // Set extension icon
    await setIcon({
      path: toolbarIcon.enabled,
    })

    // Try to enable current tab - Show message if it needs to be reloaded
    try {
      await sendTabMessage(currentTab.id, {
        type: 'heartbeat',
      })
    } catch (e) {
      await browser.notifications.create({
        iconUrl: '/icon/128.png',
        message:
          'Oops! You will need to reload this tab before Liuchan can work its ' +
          'magic! \n\nThis is only necessary on tabs that were open before Liuchan was installed :)',
        title: 'Liuchan - Please reload this tab',
        type: 'basic',
      })
    }
  }

  onConfigChange(changes: object, areaName: string) {
    console.log('config change', changes, areaName)
    console.log('config')
    return sendMessageToAllTabs({
      config: this.config.content,
      enabled: this.isEnabled,
      type: 'initialize',
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

  async messageHandler(message, sender) {
    console.log('[BACKGROUND]Received message', message, sender)

    switch (message.type) {
      case 'initialize':
        return {
          config: this.config.content,
          enabled: this.isEnabled,
          type: 'initialize',
        }
      case 'xsearch':
        return this.dict.search(message.text)
      case 'makehtml':
        return this.dict.makeHtml(message.entry)
      case 'copyToClip':
        this.copyToClip(sender.tab, message.entry)
        return
      /*case 'config':
                // Immediately update settings upon change occuring
                this.config = Object.assign(this.config, message.config);
                break;*/
      case 'toggleDefinition':
        this.dict.toggleDefinition()
        break
      case 'tts':
        // mandarin: zh-CN, zh-TW cantonese: zh-HK
        const utterance = new SpeechSynthesisUtterance(message.text)
        utterance.lang = this.config.ttsDialect
        utterance.rate = this.config.ttsSpeed
        speechSynthesis.speak(new SpeechSynthesisUtterance(message.text))
        // chrome.tts.speak(message.text, {
        //   lang: this.config.ttsDialect,
        //   rate: this.config.ttsSpeed,
        // })
        break
      case 'rebuild':
        this.dict.loadDictionary()
        break
      case 'customstyling':
        response(this.config.content.popup.customStyling)
        break
      case 'notepad':
        if (message.load) {
          response(this.config.content.notepad)
        } else {
          await browser.storage.sync.set({ notepad: message.query })
          this.config.content.notepad = message.query
        }
        break
      case 'SIGN_CONNECT':
        break
      default:
        console.log('Background received unknown request: ', message)
    }
  }
}
