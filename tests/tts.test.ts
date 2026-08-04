import { describe, expect, it } from 'vitest'

import { selectVoice } from '@/background/tts'

describe('selectVoice', () => {
  const voices = [
    { lang: 'en-US', voiceName: 'English' },
    { lang: 'zh-TW', voiceName: 'Taiwan Mandarin' },
    { lang: 'zh-CN', voiceName: 'Mainland Mandarin' },
  ]

  it('prefers an exact locale match', () => {
    expect(selectVoice(voices, 'zh-CN')?.voiceName).toBe('Mainland Mandarin')
  })

  it('falls back to another voice for the same language', () => {
    expect(selectVoice(voices, 'zh-HK')?.voiceName).toBe('Taiwan Mandarin')
  })
})
