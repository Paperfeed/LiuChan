import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { beforeAll, describe, expect, it, vi } from 'vitest'

import { Dictionary, SearchResult } from '@/background/Dictionary.ts'
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

describe('Dictionary', () => {
  let dictionary: Dictionary
  let realFileContent: string
  let totalEntries: number

  beforeAll(async () => {
    dictionary = new Dictionary()
    const filePath = path.resolve(__dirname, '../src/data/cedict_ts.u8')
    realFileContent = await readFile(filePath, 'utf-8')
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

  it('should correctly identify vowels', () => {
    expect(dictionary.isVowel('a')).toBe(true)
    expect(dictionary.isVowel('e')).toBe(true)
    expect(dictionary.isVowel('i')).toBe(true)
    expect(dictionary.isVowel('o')).toBe(true)
    expect(dictionary.isVowel('u')).toBe(true)
    expect(dictionary.isVowel('b')).toBe(false)
  })

  it('should correctly parse pinyin', () => {
    const pinyinStr = 'ci2 dian3'
    const result = dictionary.parsePinyin(pinyinStr)
    expect(result.tones).toEqual([2, 3])
    expect(result.tonemarks).toBe('cí diǎn')
  })

  it('should return results for all entries in the dictionary', () => {
    let match: RegExpExecArray | null
    let totalMatches = 0
    while ((match = REGEX_DICTIONARY.exec(realFileContent))) {
      const simplified = dictionary.search(match[2])
      expect(simplified?.entries.length).toBeGreaterThan(0)
      if (simplified?.entries.length) totalMatches++
    }
    expect(totalMatches).toBe(totalEntries)
  })

  it('should clear data when unloadDictionary is called', () => {
    dictionary.unloadDictionary()
    expect(dictionary.data.size).toBe(0)
  })
})
