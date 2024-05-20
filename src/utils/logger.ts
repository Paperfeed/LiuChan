const logLevel = 'debug'

const logLevels = ['debug', 'info', 'warn', 'error']
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
  error: createDebugFn('error', 'error'),
  info: createDebugFn('info', 'info'),
  log: createDebugFn('log', 'debug'),
  warn: createDebugFn('warn', 'warn'),
}

if (typeof window !== 'undefined') {
  window.logger = logger
}
if (typeof self !== 'undefined') {
  self.logger = logger
}

export type Logger = typeof logger
