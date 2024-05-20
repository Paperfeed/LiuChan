import '@/utils/logger'

import { store } from '@davstack/store'
import React from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'

import { DictionaryEntry } from '@/background/Dictionary'
import { ContentOptions, defaultConfig } from '@/config/defaultConfig'

import { Popup } from './components/Popup'

export const contentStore = store<
  ContentOptions & { definitions: DictionaryEntry[]; isEnabled: boolean }
>({
  ...defaultConfig.content,
  definitions: [],
  isEnabled: false,
})

function enableTab() {
  logger.log('Enabling tab')
  // this.timer = 999
  // this.keysDown[0] = 0
  // this.popup = new Popup(this.config.popup)

  // window.addEventListener('keydown', this.onKeyDown)
  // window.addEventListener('keyup', this.onKeyUp)
  // window.addEventListener('mousemove', onMouseMove)
  // window.addEventListener('mousedown', this.onMouseDown)
  // window.addEventListener('mouseup', this.onMouseUp)
  // window.onresize = this.popup.setZoomLevel

  contentStore.isEnabled.set(true)
}

function disableTab() {
  logger.log('Disabling tab')
  // Remove listeners
  // window.removeEventListener('keydown', this.onKeyDown, true)
  // window.removeEventListener('keyup', this.onKeyUp, true)
  // window.removeEventListener('mousemove', onMouseMove)
  // window.removeEventListener('mousedown', this.onMouseDown, false)
  // window.removeEventListener('mouseup', this.onMouseUp, false)
  window.onresize = null

  // Remove stylesheet and popup div
  // const css = document.getElementById('liuchan-css')
  // const popup = document.getElementById('liuchan-window')
  //
  // if (css) css.parentNode.removeChild(css)
  // if (popup) popup.parentNode.removeChild(popup)
  //
  // // Clear any highlighted text left by Liuchan
  // this.selection.clear()

  contentStore.isEnabled.set(false)
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  logger.log('[Content] Message received', message, sender)
  switch (message.type) {
    case 'initialize':
      console.log('init', message)
      break
    case 'enable':
      enableTab()
      break
    case 'disable':
      disableTab()
      break
    case 'config':
      contentStore.set({
        ...contentStore.get(),
        ...message.config,
      })
      break
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
    case 'heartbeat':
      sendResponse({ alive: true })
      enableTab()
      // if (this.config.displayHelp) {
      //   this.popup.showPopup(this.helpToolTip)
      // }
      break
    default:
      logger.error('Content script received unknown request: ', message)
  }
})

// window.addEventListener('mousemove', onMouseMove)

const root = document.createElement('div')
document.body.prepend(root)

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
)
