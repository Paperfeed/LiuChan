import { LiuChanOptions } from '@/background/config/defaultConfig.ts'
import {
  DictionaryEntry,
  MandarinPronunciation,
} from '@/background/Dictionary.ts'
import { REGEX_PINYIN } from '@/utils/language.ts'
import { toneMarksFromPinyin, zhuyinFromPinyin } from '@/utils/pinyin.ts'

export function parseMandarin(pinyin: string): MandarinPronunciation {
  const tones: number[] = []
  return {
    tonemarks: replacePinyin(pinyin, 'tonemarks', tones),
    tonenums: replacePinyin(pinyin, 'tonenums'),
    tones,
    zhuyin: replacePinyin(pinyin, 'zhuyin'),
  }
}

export function parseJyutping(jyutping: string) {
  const tones: number[] = []
  const text = jyutping.toLowerCase().replace(/([a-z]+)([1-6])/g, (_, syllable, tone) => {
    tones.push(Number(tone))
    return `${syllable}${tone}`
  })
  return { text, tones }
}

export const parseEntry = (
  traditional: string,
  simplified: string,
  pinyin: string,
  definitions: string,
  _pinyinDisplayType?: LiuChanOptions['pinyinDisplayType']
): DictionaryEntry => ({
  definitions: {
    cantonese: [],
    mandarin: definitions ? definitions.split('/').filter(Boolean) : [],
  },
  length: Math.max(traditional.length, simplified.length),
  pronunciations: { mandarin: parseMandarin(pinyin) },
  simplified,
  traditional,
})

const replacePinyin = (
  pinyin: string,
  pinyinDisplayType: LiuChanOptions['pinyinDisplayType'],
  tones: number[] = []
) =>
  pinyin.toLowerCase().replaceAll(REGEX_PINYIN, (_, syllable, tone) => {
    tones.push(parseInt(tone))
    switch (pinyinDisplayType) {
      case 'tonenums':
        return syllable + tone
      case 'zhuyin':
        return zhuyinFromPinyin(syllable, tone)
      case 'tonemarks':
        return toneMarksFromPinyin(syllable, tone)
    }
  })

export function formatDefinition(
  definition: string,
  pinyinDisplayType: LiuChanOptions['pinyinDisplayType']
) {
  return definition.replaceAll(/\[([^\]]+)\]/g, (_, pinyin) =>
    replacePinyin(pinyin, pinyinDisplayType)
  )
}
