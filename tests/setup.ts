/* eslint-disable no-console */
import { vi } from 'vitest'

import { Logger } from '@/utils/logger'

const LoggerMock: Logger = {
  debug: vi.fn(),
  error: (...args) => console.error(...args),
  info: vi.fn(),
  log: vi.fn(),
  warn: (...args) => console.warn(...args),
}

vi.stubGlobal('logger', LoggerMock)
