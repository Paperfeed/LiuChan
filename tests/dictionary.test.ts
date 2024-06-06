import path from 'node:path'

import { readFileSync } from 'fs'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { LiuChanOptions } from '@/background/config/defaultConfig.ts'
import { Dictionary, SearchResult } from '@/background/Dictionary.ts'
import { parseEntry } from '@/utils/dictionary.ts'
import { REGEX_DICTIONARY } from '@/utils/language.ts'

vi.mock('@/background/config/store', () => ({
  configStore: {
    get: vi.fn(() => ({ pinyinDisplayType: 'tonemarks' })),
    onChange: vi.fn(),
    pinyinDisplayType: {
      get: vi.fn(() => 'tonemarks'),
    },
  },
}))
const filePath = path.resolve(__dirname, '../src/data/cedict_ts.u8')
const realFileContent = readFileSync(filePath, 'utf-8')
const realFileEntries: {
  definitions: string
  pinyin: string
  simplified: string
  traditional: string
}[] = []

let match: RegExpExecArray | null
while ((match = REGEX_DICTIONARY.exec(realFileContent))) {
  const [traditional, simplified, pinyin, definitions] = match.slice(1)
  realFileEntries.push({ definitions, pinyin, simplified, traditional })
}

describe('Dictionary', () => {
  let dictionary: Dictionary

  let totalEntries: number

  beforeAll(async () => {
    dictionary = new Dictionary()
    const result = new RegExp('#! entries=(.+)').exec(realFileContent)
    if (!result) throw new Error('Could not find total entries in file')
    totalEntries = parseInt(result[1])

    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          text: () => Promise.resolve(realFileContent),
        })
      )
    )
  })

  it('should initialize with empty data', () => {
    expect(dictionary.data.size).toBe(0)
  })

  it('should load all the entries from the cedict file', async () => {
    await dictionary.loadDictionary()
    let total = 0
    for (const entries of dictionary.data.values()) {
      total += entries.length
    }
    expect(total).toBe(totalEntries)
  })

  it('should parse dictionary data correctly', async () => {
    expect(
      dictionary.data.get('词')?.find((e) => e.traditional === '詞典')
    ).toBeTruthy()
  })

  it('should return correct search results', () => {
    const result = dictionary.search('词典') as SearchResult
    expect(result.entries.length).toBeGreaterThan(1)
    const entry = result.entries.find((e) => e.simplified === '词典')
    expect(entry).toBeTruthy()
    expect(entry?.traditional).toBe('詞典')
    expect(entry?.definitions).toContain('dictionary')
  })

  it('should return results for all entries in the dictionary', () => {
    realFileEntries.forEach((entry) => {
      const result = dictionary.search(entry.simplified)
      expect(result?.entries.length).toBeGreaterThan(0)
    })
    expect(realFileEntries.length).toBe(totalEntries)
  })

  it('should properly parse all entries', () => {
    realFileEntries.forEach((entry) => {
      expect(entry.simplified).toBeDefined()
      expect(entry.traditional).toBeDefined()
      expect(entry.pinyin).toBeDefined()
      expect(entry.definitions).toBeDefined()

      const result = parseEntry(
        entry.traditional,
        entry.simplified,
        entry.pinyin,
        entry.definitions,
        'tonenums'
      )
      expect(result.simplified).toBe(entry.simplified)
      expect(result.traditional).toBe(entry.traditional)
      expect(result.definitions.length).toBeGreaterThan(0)
    })
  })

  it('should properly convert entries to the selected pinyin type', () => {
    const testEntries: {
      input: string
      output: [string, number[]]
      type: LiuChanOptions['pinyinDisplayType']
    }[] = [
      { input: 'zhu1 ming2', output: ['ㄓㄨ ㄇㄧㄥˊ', [1, 2]], type: 'zhuyin' },
      {
        input: 'feng1 huang2',
        output: ['ㄈㄥ ㄏㄨㄤˊ', [1, 2]],
        type: 'zhuyin',
      },
      { input: 'dong1 xi1', output: ['ㄉㄨㄥ ㄒㄧ', [1, 1]], type: 'zhuyin' },
      {
        input: 'shan1 dong4',
        output: ['shān dòng', [1, 4]],
        type: 'tonemarks',
      },
      { input: 'lao3 hu3', output: ['lǎo hǔ', [3, 3]], type: 'tonemarks' },
      { input: 'xue2 xiao4', output: ['xué xiào', [2, 4]], type: 'tonemarks' },
      { input: 'he2 shui3', output: ['he2 shui3', [2, 3]], type: 'tonenums' },
      { input: 'gou3 qiu2', output: ['gou3 qiu2', [3, 2]], type: 'tonenums' },
      { input: 'ji1 ji2', output: ['ji1 ji2', [1, 2]], type: 'tonenums' },
    ]

    testEntries.forEach((entry) => {
      const parsed = parseEntry('', '', entry.input, '', entry.type)
      expect(parsed.pinyin[entry.type]).toBe(entry.output[0])
      expect(parsed.pinyin.tones).toEqual(entry.output[1])
    })
  })

  it('should clear data when unloadDictionary is called', () => {
    dictionary.unloadDictionary()
    expect(dictionary.data.size).toBe(0)
  })
})
