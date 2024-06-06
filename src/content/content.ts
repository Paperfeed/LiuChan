import { createElement, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import { defineContentScript } from 'wxt/sandbox'

import { Liuchan } from '@/components/Liuchan.tsx'
import { ContentMessageType } from '@/content/contentMessages.ts'
import { contentConfig, contentStore } from '@/content/contentStore.ts'
import {
  onKeyDownHandler,
  onMouseDownHandler,
  onMouseUpHandler,
} from '@/content/keyHandler.ts'
import { messageHandler } from '@/content/messageHandler.ts'
import { activeElementIsInput } from '@/utils/activeElementIsInput.ts'
import { sendRuntimeMessage } from '@/utils/browser.ts'
import { setThemeCssVars } from '@/utils/theme.ts'

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
    mode: 'open',
    name: 'liuchan-popup',
    onMount(container) {
      // Define how your UI will be mounted inside the container
      const app = document.createElement('div')
      app.id = 'liuchan-popup'
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
  window.addEventListener('mousedown', onMouseDownHandler)
  window.addEventListener('mouseup', onMouseUpHandler)

  contentStore.isEnabled.set(true)
  contentStore.inputActive.set(activeElementIsInput())

  // Ensures config changes to the theme are reflected in the popup
  contentConfig.onChange((state) =>
    setThemeCssVars(state, contentStore.rootElement.get())
  )
}

export function disableTab() {
  logger.log('Disabling tab')
  window.removeEventListener('keydown', onKeyDownHandler, true)
  window.removeEventListener('mousedown', onMouseDownHandler, false)
  window.removeEventListener('mouseup', onMouseUpHandler, false)

  contentStore.isEnabled.set(false)
}
