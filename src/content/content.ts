import { createElement, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import { defineContentScript } from 'wxt/sandbox'

import { Liuchan } from '@/components/Liuchan.tsx'
import { themes } from '@/components/Popup/themes.ts'
import { ContentMessageType } from '@/content/contentMessages.ts'
import { contentConfig, contentStore } from '@/content/contentStore.ts'
import { onKeyDownHandler } from '@/content/keyHandler.ts'
import { messageHandler } from '@/content/messageHandler.ts'
import { activeElementIsInput } from '@/utils/activeElementIsInput.ts'
import { sendRuntimeMessage } from '@/utils/browser.ts'

// WXT doesn't export types, so I have to do this to get it instead
type ExcludeFunc<T> = T extends () => void ? never : T
type ContentContext = NonNullable<
  ExcludeFunc<Parameters<Parameters<typeof defineContentScript>[0]['main']>>[0]
>

export async function contentMain(ctx: ContentContext) {
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

  const Root = () => {
    const isEnabled = contentStore.isEnabled.use()

    return isEnabled ? createElement(Liuchan) : null
  }

  const ui = await createShadowRootUi(ctx, {
    name: 'liuchan-popup',
    onMount(container) {
      // Define how your UI will be mounted inside the container
      const app = document.createElement('div')
      app.textContent = 'Hello world!'
      container.prepend(app)
      ReactDOM.createRoot(app).render(
        createElement(StrictMode, { children: createElement(Root) })
      )
    },
    position: 'inline',
  })

  ui.mount()
}

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
