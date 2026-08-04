import { KeyboardAction } from '@/background/config/defaultConfig'
import { contentConfig, contentStore } from '@/content/contentStore'

const actionByKey: Record<string, KeyboardAction> = {
  a: KeyboardAction.AlternatePopupLocation,
  b: KeyboardAction.PreviousCharacter,
  c: KeyboardAction.Copy,
  d: KeyboardAction.ToggleDefinitions,
  escape: KeyboardAction.HidePopup,
  m: KeyboardAction.NextCharacter,
  n: KeyboardAction.NextWord,
  t: KeyboardAction.TTS,
  y: KeyboardAction.MovePopupDown,
}

export function modifierMatches(event: Pick<KeyboardEvent | MouseEvent, 'altKey' | 'ctrlKey'>) {
  switch (contentConfig.showOnModifier.get()) {
    case 'ctrl':
      return event.ctrlKey && !event.altKey
    case 'alt':
      return event.altKey && !event.ctrlKey
    case 'ctrl-alt':
      return event.ctrlKey && event.altKey
    default:
      return true
  }
}

function isEditableTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  )
}

export const onKeyDownHandler = (event: KeyboardEvent) => {
  if (
    event.repeat ||
    contentConfig.disableHotkeys.get() ||
    isEditableTarget(event.target) ||
    !modifierMatches(event)
  ) {
    return
  }
  const action = actionByKey[event.key.toLowerCase()]
  if (!action || (!contentStore.showPopup.get() && action !== KeyboardAction.HidePopup)) return
  window.dispatchEvent(new CustomEvent('liuchan:action', { detail: action }))
}

export const onKeyUpHandler = (event: KeyboardEvent) => {
  if (contentConfig.showOnModifier.get() !== 'none' && !modifierMatches(event)) {
    contentStore.showPopup.set(false)
  }
}
