import { createElement, StrictMode } from 'react'
import ReactDOM from 'react-dom/client'
import browser from 'webextension-polyfill'
import { ContentScriptContext } from 'wxt/utils/content-script-context'
import { createShadowRootUi } from 'wxt/utils/content-script-ui/shadow-root'

import { Liuchan } from '@/components/Liuchan.tsx'
import { ContentMessageType } from '@/content/contentMessages.ts'
import { contentConfig, contentStore } from '@/content/contentStore.ts'
import { onKeyDownHandler, onKeyUpHandler } from '@/content/keyHandler.ts'
import { messageHandler } from '@/content/messageHandler.ts'
import { sendRuntimeMessage } from '@/utils/browser.ts'

let listenersEnabled = false

export async function contentMain(ctx: ContentScriptContext) {
  if (document.querySelector('liuchan-popup')) return
  browser.runtime.onMessage.addListener(messageHandler)
  const response = await sendRuntimeMessage({
    type: ContentMessageType.Initialize,
  })
  contentConfig.set(response.config)

  const Root = () =>
    contentStore.isEnabled.use() ? createElement(Liuchan) : null

  const ui = await createShadowRootUi(ctx, {
    mode: 'open',
    name: 'liuchan-popup',
    onMount(container) {
      const root = container.getRootNode()
      if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
        Object.assign(root.host.style, {
          height: '0',
          left: '0',
          overflow: 'visible',
          position: 'fixed',
          top: '0',
          width: '0',
          zIndex: '2147483647',
        })
      }
      const app = document.createElement('div')
      app.id = 'liuchan-popup'
      container.prepend(app)
      contentStore.rootElement.set(app)
      ReactDOM.createRoot(app).render(
        createElement(StrictMode, { children: createElement(Root) })
      )
    },
    position: 'inline',
  })
  ui.mount()
  if (response.enabled) enableTab()
}

export function enableTab() {
  if (!listenersEnabled) {
    listenersEnabled = true
    window.addEventListener('keydown', onKeyDownHandler, true)
    window.addEventListener('keyup', onKeyUpHandler, true)
  }
  contentStore.isEnabled.set(true)
}

export function disableTab() {
  if (listenersEnabled) {
    listenersEnabled = false
    window.removeEventListener('keydown', onKeyDownHandler, true)
    window.removeEventListener('keyup', onKeyUpHandler, true)
  }
  contentStore.showPopup.set(false)
  contentStore.isEnabled.set(false)
}
