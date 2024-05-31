import { vi } from 'vitest'

import { Logger } from '@/utils/logger'

const LoggerMock: Logger = {
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  log: vi.fn(),
  warn: vi.fn(),
}

vi.stubGlobal('logger', LoggerMock)
