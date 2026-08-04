import { LiuChanOptions } from '@/background/config/defaultConfig.ts'
import { themes } from '@/components/Popup/themes.ts'

export const setThemeCssVars = (
  state: LiuChanOptions,
  rootElement: HTMLElement | null | undefined
) => {
  logger.log('Setting theme')
  if (!rootElement) return
  const theme = themes[state.theme ?? 'liuchan']
  const custom = state.customColors

  rootElement.style.setProperty('--background', theme.colors.background)
  rootElement.style.setProperty('--border', theme.colors.border)
  rootElement.style.setProperty('--tone1', custom.tone1 ?? theme.colors.tone1)
  rootElement.style.setProperty('--tone2', custom.tone2 ?? theme.colors.tone2)
  rootElement.style.setProperty('--tone3', custom.tone3 ?? theme.colors.tone3)
  rootElement.style.setProperty('--tone4', custom.tone4 ?? theme.colors.tone4)
  rootElement.style.setProperty('--tone5', custom.tone5 ?? theme.colors.tone5)
  rootElement.style.setProperty('--pinyin', theme.colors.pinyin)
  rootElement.style.setProperty('--brace', theme.colors.brace)
}
