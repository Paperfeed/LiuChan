import type { Logger } from './utils/logger'

declare const __BROWSER__: string

declare global {
  const logger: Logger
  interface Window {
    logger: Logger
  }
  interface ServiceWorkerGlobalScope {
    logger: Logger
  }
}
