import browser from 'webextension-polyfill'

import { configStore } from '@/background/config/store'
import { parseEntry } from '@/utils/dictionary.ts'
import { convertToSimplified, REGEX_DICTIONARY } from '@/utils/language'

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
  data: Map<string, DictionaryEntry[]>

  private dictFile: string | undefined

  constructor() {
    this.data = new Map()

    configStore.onChange((state, prevState) => {
      // Rebuild dictionary if dictionary related settings change
      // Todo add more related keys or change option layout to .dict.* or sth
      if (state.dictionary !== prevState.dictionary && this.data.size > 0) {
        logger.info('Rebuilding dictionary')
        this.loadDictionary(this.dictFile)
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
    map.clear()

    let longestString = 0
    let match: RegExpExecArray | null

    while ((match = REGEX_DICTIONARY.exec(dict))) {
      const [traditional, simplified, pinyin, definitions] = match.slice(1)
      // Keep track of the longest entry in the dictionary
      if (simplified.length > longestString) longestString = simplified.length

      const key = simplified.charAt(0)
      const value = map.get(key)

      const entry = parseEntry(
        traditional,
        simplified,
        pinyin,
        definitions,
        pinyinType
      )

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

    const index = this.getCharacterIndex(word.charAt(0))
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

      word = word.substring(0, length - 1)
    }

    return results
  }

  getCharacterIndex(character: string) {
    // Returns array with all words corresponding to the provided character
    return this.data.get(character)
  }
}
