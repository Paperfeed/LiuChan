import '@/utils/logger'
import '@/global.css'

import React from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'

import { themes } from '@/components/Popup/themes'
import { ContentMessageType } from '@/content/contentMessages'
import { contentConfig, contentStore } from '@/content/contentStore'
import { onKeyDownHandler } from '@/content/keyHandler'
import { messageHandler } from '@/content/messageHandler'
import { activeElementIsInput } from '@/utils/activeElementIsInput'
import { sendRuntimeMessage } from '@/utils/browser'

import { Liuchan } from './components/Liuchan'

export function enableTab() {
  logger.log('Enabling tab')
  window.addEventListener('keydown', onKeyDownHandler)
  // window.addEventListener('keyup', this.onKeyUp)
  // window.addEventListener('mousemove', onMouseMove)
  // window.addEventListener('mousedown', this.onMouseDown)
  // window.addEventListener('mouseup', this.onMouseUp)
  // window.onresize = this.popup.setZoomLevel

  contentStore.isEnabled.set(true)
  contentStore.inputActive.set(activeElementIsInput())

  contentConfig.onChange((state) => {
    const theme = themes[state.theme ?? 'liuchan']
    const setCSSVariable = document.documentElement.style.setProperty
    setCSSVariable('--background', theme.colors.background)
    setCSSVariable('--border', theme.colors.border)
    setCSSVariable('--tone-1', theme.colors.tone1)
    setCSSVariable('--tone-2', theme.colors.tone2)
    setCSSVariable('--tone-3', theme.colors.tone3)
    setCSSVariable('--tone-4', theme.colors.tone4)
    setCSSVariable('--tone-5', theme.colors.tone5)
    setCSSVariable('--pinyin', theme.colors.pinyin)
    setCSSVariable('--brace', theme.colors.brace)
  })
}

export function disableTab() {
  logger.log('Disabling tab')
  window.removeEventListener('keydown', onKeyDownHandler, true)
  // window.removeEventListener('keyup', this.onKeyUp, true)
  // window.removeEventListener('mousemove', onMouseMove)
  // window.removeEventListener('mousedown', this.onMouseDown, false)
  // window.removeEventListener('mouseup', this.onMouseUp, false)

  contentStore.isEnabled.set(false)
}

browser.runtime.onMessage.addListener(messageHandler)

sendRuntimeMessage({
  type: ContentMessageType.Initialize,
}).then((response) => {
  contentConfig.set({
    ...contentConfig.get(),
    ...response.config,
  })
  if (response.enabled) {
    enableTab()
  }
})

const root = document.createElement('div')
document.body.prepend(root)

const Root = () => {
  const isEnabled = contentStore.isEnabled.use()

  return isEnabled ? <Liuchan /> : null
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
)
