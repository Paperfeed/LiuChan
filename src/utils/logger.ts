/* eslint-disable no-console */
declare global {
  const logger: Logger
  interface Window {
    logger: Logger
  }
  interface ServiceWorkerGlobalScope {
    logger: Logger
  }
  interface GlobalThis {
    logger: Logger
  }
}

const logLevel = 'log'

const logLevels = ['debug', 'log', 'info', 'warn', 'error']
const logLevelIndex = logLevels.indexOf(logLevel)

const createDebugFn =
  <T extends 'debug' | 'info' | 'log' | 'warn' | 'error'>(
    type: T,
    level: string
  ) =>
  (...args: Parameters<(typeof console)[T]>) => {
    const levelIndex = logLevels.indexOf(level)
    if (levelIndex >= logLevelIndex) {
      console[type](`[${level.toUpperCase()}]`, ...args)
    }
  }

const logger = {
  debug: createDebugFn('debug', 'debug'),
  error: createDebugFn('error', 'error'),
  info: createDebugFn('info', 'info'),
  log: createDebugFn('log', 'log'),
  warn: createDebugFn('warn', 'warn'),
}

if (typeof window !== 'undefined') {
  window.logger = logger
}
if (typeof self !== 'undefined') {
  self.logger = logger
}

export type Logger = typeof logger
