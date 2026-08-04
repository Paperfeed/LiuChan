import { store } from '@davstack/store'

import { defaultConfig } from '@/background/config/defaultConfig'
import { DictionaryEntry } from '@/background/Dictionary'

interface ContentStore {
  definitionsVisible: boolean
  inputActive: boolean
  isEnabled: boolean
  matchingEntries: DictionaryEntry[]
  popupOffsetY: number
  popupPositionMode: 0 | 1 | 2
  rootElement: HTMLElement | null | undefined
  showPopup: boolean
  text: string
}

export const contentStore = store<ContentStore>({
  definitionsVisible: true,
  inputActive: false,
  isEnabled: false,
  matchingEntries: [],
  popupOffsetY: 0,
  popupPositionMode: 0,
  rootElement: null,
  showPopup: false,
  text: '',
})

export const contentConfig = store().state(defaultConfig)
