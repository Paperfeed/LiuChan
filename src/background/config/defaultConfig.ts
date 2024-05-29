import { themes } from '@/components/Popup/themes'
import { KeyboardShortcut } from '@/utils/keymapper'

export const CURRENT_CONFIG_VERSION = 2

export enum KeyboardAction {
  HidePopup = 'hidePopup',
  TTS = 'tts',
}

export interface ContentOptions {
  hanziDisplaySetting: 'boths' | 'simp' | 'trad' | 'botht'
  highlightMatch: boolean
  keymap: Record<KeyboardAction, KeyboardShortcut>
  pinyinDisplayType: 'tonemarks' | 'tonenums' | 'zhuyin'
  theme: keyof typeof themes
  ttsDialect: string
  ttsSpeed: number
  useToneColors: boolean
}

export interface LiuChanOptions {
  content: ContentOptions
}

export const defaultConfig: LiuChanOptions = {
  content: {
    hanziDisplaySetting: 'boths',
    highlightMatch: false,
    keymap: {
      [KeyboardAction.TTS]: {
        key: 't',
        modifiers: [false, true, false],
      },
      [KeyboardAction.HidePopup]: {
        key: 'Escape',
        modifiers: [false, false, false],
      },
    },
    pinyinDisplayType: 'tonemarks',
    theme: 'pleco',
    ttsDialect: 'zh-CN',
    ttsSpeed: 0.9,
    useToneColors: true,
  },
}

// export interface ContentOptions {
//   disableKeys: boolean
//   displayHelp: boolean
//   highlightInput: boolean
//   highlightText: boolean
//   notepad: NotepadOptions
//   popup: PopupOptions
//   showOnKey: number
// }

// export interface LiuChanOptions {
//   content: ContentOptions
//   copySeparator: string
//   customTones: string[]
//   definitionSeparator: string
//   hanziType: 'boths' | 'simp' | 'trad' | 'botht'
//   lineEnding: string
//   maxClipCopyEntries: number
//   pinyinType: 'tonemarks' | 'tonenums' | 'zhuyin'
//   ttsDialect: string
//   ttsSpeed: number
//   useCustomTones: boolean
//   useHanziToneColors: boolean
//   usePinyinToneColors: boolean
// }

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

//
// export const defaultConfig: LiuChanOptions = {
//   content: {
//     disableKeys: false,
//     displayHelp: true,
//     highlightInput: false,
//     highlightText: true,
//     notepad: {
//       pinned: false,
//       text:
//         'This notepad will automatically save its contents and sync with your Chrome account ' +
//         '(if you use sync!).\n\n' +
//         'You can drag the notepad around and resize the text area.',
//     },
//     popup: {
//       customStyling: {
//         borderRadius: 8,
//         borderThickness: 2,
//         customColors: ['#ffffe0', '#d7d3af', 'RGBA(0,8,8,0.1)'],
//       },
//       popupDelay: 0,
//       popupTheme: 'liuchan',
//       scaleOnZoom: true,
//       useCustomization: false,
//     },
//     showOnKey: 0,
//     useToneColors: true,
//   } as ContentOptions,
//   copySeparator: 'tab',
//   customTones: [
//     '#f2777a',
//     '#99cc99',
//     '#6699cc',
//     '#cc99cc',
//     '#cccccc',
//     '#66cccc',
//   ],
//   definitionSeparator: 'num',
//   hanziType: 'boths',
//   lineEnding: 'n',
//   maxClipCopyEntries: 7,
//   pinyinType: 'tonemarks',
//   ttsDialect: 'zh-CN',
//   ttsSpeed: 0.9,
//   useCustomTones: false,
//   useHanziToneColors: true,
//   usePinyinToneColors: false,
// }
