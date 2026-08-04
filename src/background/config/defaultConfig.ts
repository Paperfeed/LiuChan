import { Theme } from '@/components/Popup/themes'

export const CURRENT_CONFIG_VERSION = 3

export enum KeyboardAction {
  AlternatePopupLocation = 'alternatePopupLocation',
  Copy = 'copy',
  HidePopup = 'hidePopup',
  MovePopupDown = 'movePopupDown',
  NextCharacter = 'nextCharacter',
  NextWord = 'nextWord',
  PreviousCharacter = 'previousCharacter',
  TTS = 'tts',
  ToggleDefinitions = 'toggleDefinitions',
}

export type DictionaryMode = 'mandarin' | 'cantonese' | 'both'
export type ModifierKey = 'none' | 'ctrl' | 'alt' | 'ctrl-alt'

export interface LiuChanOptions {
  copySeparator: 'tab' | 'comma' | 'space'
  customColors: {
    background?: string
    border?: string
    shadow?: string
    tone1?: string
    tone2?: string
    tone3?: string
    tone4?: string
    tone5?: string
  }
  dictionary: DictionaryMode
  disableHotkeys: boolean
  hanziDisplaySetting: 'boths' | 'simp' | 'trad' | 'botht'
  highlightMatch: boolean
  highlightMatchInInputs: boolean
  lineEnding: 'unix' | 'windows' | 'mac'
  maximumEntries: number
  pinyinDisplayType: 'tonemarks' | 'tonenums' | 'zhuyin'
  popupBorderRadius: number
  popupBorderThickness: number
  popupDelay: number
  popupShadowOpacity: number
  separator: 'num' | 'semi' | 'slash'
  showOnModifier: ModifierKey
  theme: Theme
  ttsDialect: 'zh-CN' | 'zh-TW' | 'zh-HK'
  ttsSpeed: number
  useCustomPopupColors: boolean
  useHanziToneColors: boolean
  usePinyinToneColors: boolean
}

export const defaultConfig: LiuChanOptions = {
  copySeparator: 'tab',
  customColors: {},
  dictionary: 'mandarin',
  disableHotkeys: false,
  hanziDisplaySetting: 'boths',
  highlightMatch: true,
  highlightMatchInInputs: false,
  lineEnding: 'unix',
  maximumEntries: 7,
  pinyinDisplayType: 'tonemarks',
  popupBorderRadius: 8,
  popupBorderThickness: 2,
  popupDelay: 0,
  popupShadowOpacity: 25,
  separator: 'num',
  showOnModifier: 'none',
  theme: 'liuchan',
  ttsDialect: 'zh-CN',
  ttsSpeed: 0.9,
  useCustomPopupColors: false,
  useHanziToneColors: true,
  usePinyinToneColors: false,
}

export function sanitizeConfig(value: unknown): LiuChanOptions {
  const input = (value && typeof value === 'object' ? value : {}) as Record<
    string,
    any
  >
  const content = input.content ?? {}
  const styling = input.styling ?? {}
  const customTones = input.customTones ?? []
  const modifierMap: Record<string | number, ModifierKey> = {
    0: 'none',
    1: 'ctrl',
    2: 'alt',
    3: 'ctrl-alt',
    Alt: 'alt',
    Ctrl: 'ctrl',
    CtrlAlt: 'ctrl-alt',
  }

  const config: LiuChanOptions = {
    ...defaultConfig,
    copySeparator: input.copySeparator ?? defaultConfig.copySeparator,
    customColors: {
      ...defaultConfig.customColors,
      ...(input.customColors ?? {}),
      background: input.customColors?.background ?? styling.customColors?.[0],
      border: input.customColors?.border ?? styling.customColors?.[1],
      shadow: input.customColors?.shadow ?? styling.customColors?.[2],
      tone1: input.customColors?.tone1 ?? customTones[0],
      tone2: input.customColors?.tone2 ?? customTones[1],
      tone3: input.customColors?.tone3 ?? customTones[2],
      tone4: input.customColors?.tone4 ?? customTones[3],
      tone5: input.customColors?.tone5 ?? customTones[4],
    },
    dictionary: input.dictionary ?? defaultConfig.dictionary,
    disableHotkeys:
      input.disableHotkeys ??
      content.disableKeys ??
      defaultConfig.disableHotkeys,
    hanziDisplaySetting:
      input.hanziDisplaySetting ??
      input.hanziType ??
      input.showHanzi ??
      defaultConfig.hanziDisplaySetting,
    highlightMatch:
      input.highlightMatch ??
      content.highlightText ??
      defaultConfig.highlightMatch,
    highlightMatchInInputs:
      input.highlightMatchInInputs ??
      content.highlightInput ??
      defaultConfig.highlightMatchInInputs,
    lineEnding:
      input.lineEnding === 'r'
        ? 'mac'
        : input.lineEnding === 'rn'
        ? 'windows'
        : input.lineEnding ?? defaultConfig.lineEnding,
    maximumEntries: Number(
      input.maximumEntries ??
        input.maxClipCopyEntries ??
        defaultConfig.maximumEntries
    ),
    pinyinDisplayType:
      input.pinyinDisplayType ??
      input.pinyinType ??
      input.pinyin ??
      defaultConfig.pinyinDisplayType,
    popupBorderRadius: Number(
      input.popupBorderRadius ??
        styling.borderRadius ??
        defaultConfig.popupBorderRadius
    ),
    popupBorderThickness: Number(
      input.popupBorderThickness ??
        styling.borderThickness ??
        defaultConfig.popupBorderThickness
    ),
    popupDelay: Number(
      input.popupDelay ?? content.popupDelay ?? defaultConfig.popupDelay
    ),
    popupShadowOpacity: Number(
      input.popupShadowOpacity ?? defaultConfig.popupShadowOpacity
    ),
    separator:
      input.separator ??
      input.definitionSeparator ??
      input.numdef ??
      defaultConfig.separator,
    showOnModifier:
      input.showOnModifier ??
      modifierMap[content.showOnKey ?? input.showOnKey] ??
      defaultConfig.showOnModifier,
    theme: input.theme ?? content.popupTheme ?? defaultConfig.theme,
    ttsDialect: input.ttsDialect ?? defaultConfig.ttsDialect,
    ttsSpeed: Number(input.ttsSpeed ?? defaultConfig.ttsSpeed),
    useCustomPopupColors:
      input.useCustomPopupColors ?? styling.useCustomization ?? false,
    useHanziToneColors:
      input.useHanziToneColors ?? input.useToneColors ?? input.doColors ?? true,
    usePinyinToneColors:
      input.usePinyinToneColors ?? input.doPinyinColors ?? false,
  }

  config.maximumEntries = Math.min(50, Math.max(1, config.maximumEntries || 7))
  config.popupDelay = Math.min(2000, Math.max(0, config.popupDelay || 0))
  config.popupBorderRadius = Math.min(
    24,
    Math.max(0, config.popupBorderRadius || 0)
  )
  config.popupBorderThickness = Math.min(
    10,
    Math.max(0, config.popupBorderThickness || 0)
  )
  config.popupShadowOpacity = Math.min(
    100,
    Math.max(0, config.popupShadowOpacity || 0)
  )
  config.ttsSpeed = Math.min(2, Math.max(0.1, config.ttsSpeed || 0.9))
  if (!['mandarin', 'cantonese', 'both'].includes(config.dictionary))
    config.dictionary = defaultConfig.dictionary
  if (!['boths', 'simp', 'trad', 'botht'].includes(config.hanziDisplaySetting))
    config.hanziDisplaySetting = defaultConfig.hanziDisplaySetting
  if (!['tonemarks', 'tonenums', 'zhuyin'].includes(config.pinyinDisplayType))
    config.pinyinDisplayType = defaultConfig.pinyinDisplayType
  if (!['num', 'semi', 'slash'].includes(config.separator))
    config.separator = defaultConfig.separator
  if (!['none', 'ctrl', 'alt', 'ctrl-alt'].includes(config.showOnModifier))
    config.showOnModifier = defaultConfig.showOnModifier
  if (
    !['charcoal', 'liuchan', 'paper', 'pleco', 'sepia'].includes(config.theme)
  )
    config.theme = defaultConfig.theme
  if (!['zh-CN', 'zh-TW', 'zh-HK'].includes(config.ttsDialect))
    config.ttsDialect = defaultConfig.ttsDialect
  return config
}
