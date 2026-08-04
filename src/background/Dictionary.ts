import browser from 'webextension-polyfill'

import { DictionaryMode } from '@/background/config/defaultConfig'
import { configStore } from '@/background/config/store'
import { parseEntry, parseJyutping } from '@/utils/dictionary.ts'

export interface MandarinPronunciation {
  tonemarks: string
  tonenums: string
  tones: number[]
  zhuyin: string
}

export interface DictionaryEntry {
  definitions: { cantonese: string[]; mandarin: string[] }
  length: number
  pronunciations: {
    cantonese?: { text: string; tones: number[] }
    mandarin?: MandarinPronunciation
  }
  simplified: string
  traditional: string
}

export interface SearchResult {
  entries: DictionaryEntry[]
  longestMatchLength?: number
}

export interface DictionaryFiles {
  canto: string
  cedict: string
  readings: string
}

const ENTRY_PATTERN =
  /^(\S+)\s+(\S+)\s+\[([^\]]+)](?:\s+\{([^}]+)})?(?:\s+\/([\s\S]*)\/)?(?:\s+#.*)?$/

const unique = (values: string[]) => [...new Set(values.filter(Boolean))]
const keyFor = (traditional: string, simplified: string) =>
  `${traditional}\u0000${simplified}`
const pinyinKey = (pinyin: string) => pinyin.replaceAll(' ', '').toLowerCase()

export class Dictionary {
  data = new Map<string, DictionaryEntry[]>()
  private loadedMode?: DictionaryMode

  constructor() {
    configStore.onChange((state, previous) => {
      if (state.dictionary !== previous.dictionary && this.data.size) {
        this.unloadDictionary()
      }
    })
  }

  async loadDictionary(files?: Partial<DictionaryFiles>) {
    const resolved: DictionaryFiles = {
      canto: files?.canto ?? (await this.readFile('data/cccanto-webdist.txt')),
      cedict: files?.cedict ?? (await this.readFile('data/cedict_ts.u8')),
      readings:
        files?.readings ??
        (await this.readFile('data/cccedict-canto-readings.txt')),
    }
    this.parseDictionaries(resolved, configStore.dictionary.get())
  }

  async ensureLoaded(files?: Partial<DictionaryFiles>) {
    const mode = configStore.dictionary.get()
    if (!this.data.size || this.loadedMode !== mode)
      await this.loadDictionary(files)
  }

  async readFile(filename: string) {
    const response = await fetch(browser.runtime.getURL(filename))
    if (!response.ok) throw new Error(`Could not load ${filename}`)
    return response.text()
  }

  parseDictionary(dict: string) {
    this.parseDictionaries(
      { canto: '', cedict: dict, readings: '' },
      'mandarin'
    )
  }

  parseDictionaries(files: DictionaryFiles, mode: DictionaryMode) {
    const byKey = new Map<string, DictionaryEntry[]>()
    const readings = new Map<string, Map<string, string>>()

    for (const line of files.readings.split(/\r?\n/)) {
      const match = ENTRY_PATTERN.exec(line)
      if (!match?.[4]) continue
      const [, traditional, simplified, pinyin, jyutping] = match
      const variants =
        readings.get(keyFor(traditional, simplified)) ?? new Map()
      variants.set(pinyinKey(pinyin), jyutping)
      readings.set(keyFor(traditional, simplified), variants)
    }

    for (const line of files.cedict.split(/\r?\n/)) {
      const match = ENTRY_PATTERN.exec(line)
      if (!match) continue
      const [, traditional, simplified, pinyin, , definitions = ''] = match
      const entry = parseEntry(traditional, simplified, pinyin, definitions)
      const readingVariants = readings.get(keyFor(traditional, simplified))
      const jyutping =
        readingVariants?.get(pinyinKey(pinyin)) ??
        readingVariants?.values().next().value
      if (jyutping) entry.pronunciations.cantonese = parseJyutping(jyutping)
      const key = keyFor(traditional, simplified)
      byKey.set(key, [...(byKey.get(key) ?? []), entry])
    }

    for (const line of files.canto.split(/\r?\n/)) {
      const match = ENTRY_PATTERN.exec(line)
      if (!match?.[4]) continue
      const [, traditional, simplified, pinyin, jyutping, definitions = ''] =
        match
      const key = keyFor(traditional, simplified)
      const existing = (byKey.get(key) ?? []).find(
        (entry) =>
          entry.pronunciations.mandarin?.tonenums.replaceAll(' ', '') ===
          pinyinKey(pinyin)
      )
      const entry = existing ?? parseEntry(traditional, simplified, pinyin, '')
      entry.pronunciations.cantonese = parseJyutping(jyutping)
      entry.definitions.cantonese = unique([
        ...entry.definitions.cantonese,
        ...definitions.split('/'),
      ])
      if (!existing) byKey.set(key, [...(byKey.get(key) ?? []), entry])
    }

    this.data.clear()
    for (const entries of byKey.values()) {
      for (const entry of entries) {
        const included =
          mode === 'both' ||
          (mode === 'mandarin' && Boolean(entry.definitions.mandarin.length)) ||
          (mode === 'cantonese' && Boolean(entry.pronunciations.cantonese))
        if (!included) continue
        for (const first of new Set([
          entry.simplified.charAt(0),
          entry.traditional.charAt(0),
        ])) {
          this.data.set(first, [...(this.data.get(first) ?? []), entry])
        }
      }
    }
    this.loadedMode = mode
    logger.info(`Dictionary loaded in ${mode} mode`, this.data.size)
  }

  unloadDictionary() {
    this.data.clear()
    this.loadedMode = undefined
  }

  search(text: string): SearchResult | undefined {
    const index = this.data.get(text.charAt(0))
    if (!index) return
    const matches: { entry: DictionaryEntry; length: number }[] = []

    for (const entry of index) {
      const match = [entry.simplified, entry.traditional].find((word) =>
        text.startsWith(word)
      )
      if (!match) continue
      matches.push({ entry, length: match.length })
    }
    if (!matches.length) return
    matches.sort((first, second) => second.length - first.length)
    return {
      entries: matches.map(({ entry }) => entry),
      longestMatchLength: matches[0].length,
    }
  }

  getCharacterIndex(character: string) {
    return this.data.get(character)
  }
}
