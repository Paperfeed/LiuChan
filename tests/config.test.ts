import { describe, expect, it } from 'vitest'

import {
  defaultConfig,
  sanitizeConfig,
} from '@/background/config/defaultConfig'

describe('sanitizeConfig', () => {
  it('migrates legacy settings and keeps safe defaults', () => {
    const config = sanitizeConfig({
      content: {
        disableKeys: true,
        highlightInput: true,
        highlightText: false,
        popupDelay: 250,
        popupTheme: 'paper',
        showOnKey: 3,
      },
      hanziType: 'trad',
      lineEnding: 'rn',
      maxClipCopyEntries: '12',
      pinyinType: 'zhuyin',
      styling: { borderRadius: 12, borderThickness: 4 },
    })

    expect(config).toMatchObject({
      disableHotkeys: true,
      hanziDisplaySetting: 'trad',
      highlightMatch: false,
      highlightMatchInInputs: true,
      lineEnding: 'windows',
      maximumEntries: 12,
      pinyinDisplayType: 'zhuyin',
      popupBorderRadius: 12,
      popupBorderThickness: 4,
      popupDelay: 250,
      showOnModifier: 'ctrl-alt',
      theme: 'paper',
    })
  })

  it('defaults to LiuChan and preserves every supported legacy theme', () => {
    expect(defaultConfig.theme).toBe('liuchan')
    for (const theme of ['charcoal', 'liuchan', 'paper', 'pleco', 'sepia']) {
      expect(sanitizeConfig({ theme }).theme).toBe(theme)
    }
  })

  it('clamps numeric values and rejects invalid enums', () => {
    const config = sanitizeConfig({
      dictionary: 'invalid',
      maximumEntries: 999,
      popupDelay: -10,
      ttsSpeed: 8,
    })
    expect(config.dictionary).toBe('mandarin')
    expect(config.maximumEntries).toBe(50)
    expect(config.popupDelay).toBe(0)
    expect(config.ttsSpeed).toBe(2)
  })
})
