import { store } from '@davstack/store'

import { defaultConfig } from '@/background/config/defaultConfig'
import { DictionaryEntry } from '@/background/Dictionary'

interface ContentStore {
  inputActive: boolean
  isEnabled: boolean
  matchingEntries: DictionaryEntry[]
  rootElement: HTMLElement | null | undefined
  showPopup: boolean
  text: string
}

export const contentStore = store<ContentStore>({
  inputActive: false,
  isEnabled: false,
  matchingEntries: [],
  rootElement: null,
  showPopup: false,
  text: '',
})

export const contentConfig = store().state(defaultConfig)
