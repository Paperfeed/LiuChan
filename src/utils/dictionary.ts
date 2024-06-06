import { LiuChanOptions } from '@/background/config/defaultConfig.ts'
import { DictionaryEntry } from '@/background/Dictionary.ts'
import { REGEX_PINYIN } from '@/utils/language.ts'
import { toneMarksFromPinyin, zhuyinFromPinyin } from '@/utils/pinyin.ts'

export const parseEntry = (
  traditional: string,
  simplified: string,
  pinyin: string,
  definitions: string,
  pinyinDisplayType: LiuChanOptions['pinyinDisplayType']
): DictionaryEntry => {
  const parsedDefinitions = parseDefinitions(
    definitions,
    pinyinDisplayType
  ).split('/')
  const tones: number[] = []
  const parsedPinyin = replacePinyin(pinyin, pinyinDisplayType, tones)

  return {
    definitions: parsedDefinitions,
    length: simplified.length,
    pinyin: {
      [pinyinDisplayType]: parsedPinyin,
      tones,
    },
    simplified,
    traditional,
  }
}

const replacePinyin = (
  pinyin: string,
  pinyinDisplayType: LiuChanOptions['pinyinDisplayType'],
  tones: number[] = []
) =>
  pinyin.toLowerCase().replaceAll(REGEX_PINYIN, (_, pinyin, tone) => {
    tones.push(parseInt(tone))
    switch (pinyinDisplayType) {
      case 'tonenums':
        return pinyin + tone
      case 'zhuyin':
        return zhuyinFromPinyin(pinyin, tone)
      case 'tonemarks':
        return toneMarksFromPinyin(pinyin, tone)
    }
  })

function parseDefinitions(
  definitions: string,
  pinyinDisplayType: LiuChanOptions['pinyinDisplayType']
) {
  return definitions.replaceAll(/\[([^\]]+)\]/g, (_, pinyin) => {
    return replacePinyin(pinyin, pinyinDisplayType)
  })
}
