import browser from 'webextension-polyfill'

import {
  defaultConfig,
  LiuChanOptions,
} from '@/background/config/defaultConfig'

export async function migrateConfig(
  storedSettings: unknown,
  version: number
): Promise<LiuChanOptions> {
  // Ensure users don't lose their customized settings after updated where stuff has been changed around.
  if (version < 2) {
    logger.info('Liuchan has been updated; Attempting to convert old settings')
    // Get ALL items from storage and compare them to the default config, reassigning old values to
    // new keys where appropriate.
    const outdatedSettings = await browser.storage.sync.get(null)
    const updatedSettings = structuredClone(defaultConfig)
    for (const key in outdatedSettings) {
      // if (!items.hasOwnProperty(key)) {console.log(key);} // for DEBUG purposes
      switch (key) {
        case 'showOnKey':
          const str = outdatedSettings.showOnKey
          if (str === 'Ctrl') {
            updatedSettings.content.showOnKey = 1
          } else if (str === 'Alt') {
            updatedSettings.content.showOnKey = 2
          } else if (str === 'CtrlAlt') {
            updatedSettings.content.showOnKey = 3
          } else {
            updatedSettings.content.showOnKey = 0
          }
          break
        case 'doColors':
          updatedSettings.useHanziToneColors = outdatedSettings.doColors
          break
        case 'doPinyinColors':
          updatedSettings.usePinyinToneColors = outdatedSettings.doPinyinColors
          break
        case 'miniHelp':
          updatedSettings.content.displayHelp = outdatedSettings.miniHelp
          break
        case 'numdef':
          updatedSettings.definitionSeparator = outdatedSettings.numdef
          break
        case 'pinyin':
          updatedSettings.pinyinType = outdatedSettings.pinyin
          break
        case 'showHanzi':
          updatedSettings.hanziType = outdatedSettings.showHanzi
          break
        case 'useCustomTone':
          updatedSettings.useCustomTones = outdatedSettings.useCustomTone
          break
        default:
          if (Object.prototype.hasOwnProperty.call(updatedSettings, key)) {
            ;(updatedSettings as any)[key] = outdatedSettings[key]
          }
      }
    }
    // Empty storage to get rid of deprecated keys and save the new updated list
    await browser.storage.sync.clear()
    await browser.storage.sync.set(updatedSettings)
    logger.info('Successfully converted settings!')
    return updatedSettings
  }

  logger.warn('No settings to convert! Returning default config')
  return storedSettings as LiuChanOptions
}
