import browser from 'webextension-polyfill'

import { configStore } from '@/background/config/store'
import {
  convertToSimplified,
  REGEX_DICTIONARY,
  REGEX_PINYIN,
} from '@/utils/language'
import {
  pinyinReference,
  toneCharMap,
  zhuyinReference,
} from '@/utils/pinyinReference'

export interface DictionaryEntry {
  definitions: string[]
  length: number
  pinyin: PinyinResult
  simplified: string
  traditional: string
}

interface PinyinResult {
  tonemarks?: string
  tonenums?: string
  tones: number[]
  zhuyin?: string
}

export interface SearchResult {
  entries: DictionaryEntry[]
  longestMatchLength?: number
}

export class Dictionary {
  protected data: Map<string, DictionaryEntry[]>

  private showDefinition: boolean
  private dictFile: string | undefined

  constructor() {
    this.data = new Map()
    this.showDefinition = true

    configStore.onChange((state, prevState) => {
      // Rebuild dictionary if dictionary related settings change
      // Todo add more related keys or change options layout to .dict.* or sth
      if (state.dictionary !== prevState.dictionary && this.data.size > 0) {
        logger.info('Rebuilding dictionary')
        this.loadDictionary(state.dictionary)
      }
    })
  }

  async loadDictionary(dictFile = 'data/cedict_ts.u8') {
    const data = await this.readFile(dictFile)
    this.dictFile = dictFile
    this.parseDictionary(data)
  }

  /**
   * This unloads the dictionary from memory, lowering the memory footprint of the extension.
   */
  unloadDictionary() {
    this.data.clear()
  }

  async readFile(filename: string) {
    const response = await fetch(browser.runtime.getURL(filename))
    return await response.text()
  }

  parseDictionary(dict: string) {
    // Match every entry in the dictionary and map it to an object
    const pinyinType = configStore.pinyinDisplayType.get() ?? 'tonemarks'
    const map = this.data

    let longestString = 0
    let match: RegExpExecArray | null

    while ((match = REGEX_DICTIONARY.exec(dict))) {
      const traditional = match[1]
      const simplified = match[2]
      const pinyin = this.parsePinyin(match[3])

      // Keep track of the longest entry in the dictionary
      if (simplified.length > longestString) longestString = simplified.length

      let pinyinMatch: RegExpExecArray | null
      let def = match[4]
      // This replaces the pinyin in the definitions with the user specified pinyin format
      while ((pinyinMatch = REGEX_PINYIN.exec(match[4]))) {
        def = def.replace(
          pinyinMatch[0],
          '[' + this.parsePinyin(pinyinMatch[1])[pinyinType] + ']'
        )
      }

      const definitions = def.split('/')
      const key = simplified.charAt(0)
      const value = map.get(key)

      const entry: DictionaryEntry = {
        definitions,
        length: simplified.length,
        pinyin,
        simplified,
        traditional,
      }

      if (value) {
        value.push(entry)
        map.set(key, value)
      } else {
        map.set(key, [entry])
      }
    }

    // I noticed that chrome keeps the last regex match in memory
    // which in this case is the entire dictionary file, so this is to lower the memory footprint
    ;/./g.exec('c')

    logger.log('Dictionary Loaded', this.data)
    logger.log('Longest string:', longestString)
  }

  search(word: string) {
    // Convert to simplified so that we only have to index search for one type of character
    // making it easier to get through the data quickly.
    word = convertToSimplified(word)

    const index = this.data.get(word.charAt(0))
    if (!index) return // If first character doesn't match with anything, stop looking

    const results: SearchResult = { entries: [] }

    // Loop through all matched text and delete one character off the end each loop, returning all matches
    for (let length = word.length; length > 0; length--) {
      for (let i = 0, len = index.length; i < len; i++) {
        if (index[i].simplified === word) {
          // Save the length of the longest result (for selection purposes)
          if (!results.longestMatchLength)
            results.longestMatchLength = word.length
          results.entries.push(index[i])
        }
      }

      word = word.substr(0, length - 1)
    }

    console.log(results)
    return results
  }

  getCharacterIndex(character: string) {
    // Returns array with all words corresponding to the provided character
    return this.data.get(character)
  }

  isVowel(letter: string): boolean {
    return (
      letter === 'a' ||
      letter === 'e' ||
      letter === 'i' ||
      letter === 'o' ||
      letter === 'u'
    )
  }

  parsePinyin(pinyinStr: string): PinyinResult {
    const pinyin = pinyinStr.split(' ')
    const config = configStore.get()
    const result: PinyinResult = { tones: [] }
    const pinyinDisplayType = config.pinyinDisplayType ?? 'tonemarks'
    const addToneMarks = pinyinDisplayType === 'tonemarks'
    const addToneNums = pinyinDisplayType === 'tonenums'
    const addZhuyin = pinyinDisplayType === 'zhuyin'

    const tonenums = []
    const zhuyin = []

    for (let i = 0; i < pinyin.length; i++) {
      let pin = pinyin[i].replace('u:', '\u00FC')
      let tone = 4

      if (addToneNums) {
        tonenums.push(pin.toLowerCase())
      }

      if (pin.indexOf('1') !== -1) tone = 0
      else if (pin.indexOf('2') !== -1) tone = 1
      else if (pin.indexOf('3') !== -1) tone = 2
      else if (pin.indexOf('4') !== -1) tone = 3

      result.tones.push(tone + 1)

      if (addZhuyin) {
        const prepin = pin.substring(0, pin.length - 1)
        const index = pinyinReference.indexOf(prepin.toLowerCase())
        zhuyin.push(zhuyinReference[index] + toneCharMap.z[tone])
      }

      if (addToneMarks) {
        if (pin.indexOf('a') !== -1) pin = pin.replace('a', toneCharMap.a[tone])
        else if (pin.indexOf('e') !== -1)
          pin = pin.replace('e', toneCharMap.e[tone])
        else if (pin.indexOf('ou') !== -1)
          pin = pin.replace('o', toneCharMap.o[tone])
        else {
          for (let k = pin.length - 1; k >= 0; k--) {
            if (this.isVowel(pin[k])) {
              switch (pin[k]) {
                case 'i':
                  pin = pin.replace('i', toneCharMap.i[tone])
                  break
                case 'o':
                  pin = pin.replace('o', toneCharMap.o[tone])
                  break
                case 'u':
                  pin = pin.replace('u', toneCharMap.u[tone])
                  break
                case '\u00FC':
                  pin = pin.replace('\u00FC', toneCharMap.v[tone])
                  break
                default:
                  logger.error('Exception: weird vowel ' + pin[k])
              }
              break
            }
          }
        }
        //strip the number
        pinyin[i] = pin.substring(0, pin.length - 1)
      }
    }

    // Add only relevant readings to pinyin object (smaller memory footprint)
    if (addToneMarks) result.tonemarks = pinyin.join(' ')
    if (addToneNums) result.tonenums = tonenums.join(' ')
    if (addZhuyin) result.zhuyin = zhuyin.join(' ')
    return result
  }
}
