import '@/utils/logger.ts'
import '@/global.css'

import { contentMain } from '@/content/content.ts'
export default defineContentScript({
  cssInjectionMode: 'ui',
  main: (ctx) => contentMain(ctx),
  matches: ['<all_urls>'],
  runAt: 'document_idle',
})
