import { KeyboardAction } from '@/background/config/defaultConfig'
import { contentConfig, contentStore } from '@/content/contentStore'
import { activeElementIsInput } from '@/utils/activeElementIsInput'
import { convertKeysToAction } from '@/utils/keymapper'

export const onKeyDownHandler = convertKeysToAction((action) => {
  logger.log('[KeyHandler] Action:', action)
  if (contentStore.inputActive.get()) {
    logger.debug('[KeyHandler] Input active, ignoring action')
    return
  }

  switch (action) {
    case KeyboardAction.HidePopup:
      contentStore.showPopup.set(false)
      return
    case KeyboardAction.TTS:
      const config = contentConfig.get()
      const text = contentStore.text.get()
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = config.ttsDialect
      utterance.rate = config.ttsSpeed
      speechSynthesis.speak(utterance)
      return
  }
})

document.addEventListener('focusin', () => {
  contentStore.inputActive.set(activeElementIsInput())
})

export const onMouseDownHandler = () => {
  // Technically not an active input, but we want to prevent the selection from being overridden
  contentStore.inputActive.set(true)
  document.getSelection()?.removeAllRanges()
}

export const onMouseUpHandler = () => {
  contentStore.inputActive.set(activeElementIsInput())
}
