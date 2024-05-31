import { store } from '@davstack/store'

import { defaultConfig } from '@/background/config/defaultConfig'
import { DictionaryEntry } from '@/background/Dictionary'

interface ContentStore {
  inputActive: boolean
  isEnabled: boolean
  matchingEntries: DictionaryEntry[]
  showPopup: boolean
  text: string
}

export const contentConfig = store().state(defaultConfig)

export const contentStore = store<ContentStore>().state({
  inputActive: false,
  isEnabled: false,
  matchingEntries: [],
  showPopup: false,
  text: '',
})
