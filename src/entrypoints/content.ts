import '@/utils/logger.ts'
import '@/global.css'

import { contentMain } from '@/content/content.ts'
import { defineContentScript } from 'wxt/utils/define-content-script'
export default defineContentScript({
  cssInjectionMode: 'ui',
  main: (ctx) => contentMain(ctx),
  matches: ['<all_urls>'],
  allFrames: true,
  runAt: 'document_idle',
})
