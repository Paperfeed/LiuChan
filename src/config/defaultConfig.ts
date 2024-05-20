export const CURRENT_CONFIG_VERSION = '1.1.0'

export interface ContentOptions {
  disableKeys: boolean
  displayHelp: boolean
  highlightInput: boolean
  highlightText: boolean
  notepad: NotepadOptions
  popup: PopupOptions
  showOnKey: number
}

export interface NotepadOptions {
  pinned: boolean
  pos?: []
  size?: []
  text: string
}

export interface PopupOptions {
  customStyling?: {
    borderRadius: number
    borderThickness: number
    customColors: string[]
  }
  popupDelay: number
  popupTheme: string
  scaleOnZoom: boolean
  useCustomization: boolean
}

export interface LiuChanOptions {
  content: ContentOptions
  copySeparator: string
  customTones: string[]
  definitionSeparator: string
  hanziType: string
  lineEnding: string
  maxClipCopyEntries: number
  pinyinType: string
  ttsDialect: string
  ttsSpeed: number
  useCustomTones: boolean
  useHanziToneColors: boolean
  usePinyinToneColors: boolean
  version?: string
}

export const defaultConfig = {
  content: {
    disableKeys: false,
    displayHelp: true,
    highlightInput: false,
    highlightText: true,
    notepad: {
      pinned: false,
      text:
        'This notepad will automatically save its contents and sync with your Chrome account ' +
        '(if you use sync!).\n\n' +
        'You can drag the notepad around and resize the text area.',
    },
    popup: {
      customStyling: {
        borderRadius: 8,
        borderThickness: 2,
        customColors: ['#ffffe0', '#d7d3af', 'RGBA(0,8,8,0.1)'],
      },
      popupDelay: 0,
      popupTheme: 'liuchan',
      scaleOnZoom: true,
      useCustomization: false,
    },
    showOnKey: 0,
  } as ContentOptions,
  copySeparator: 'tab',
  customTones: [
    '#f2777a',
    '#99cc99',
    '#6699cc',
    '#cc99cc',
    '#cccccc',
    '#66cccc',
  ],
  definitionSeparator: 'num',
  hanziType: 'boths',
  lineEnding: 'n',
  maxClipCopyEntries: 7,
  pinyinType: 'tonemarks',
  ttsDialect: 'zh-CN',
  ttsSpeed: 0.9,
  useCustomTones: false,
  useHanziToneColors: true,
  usePinyinToneColors: false,
  version: CURRENT_CONFIG_VERSION,
}
