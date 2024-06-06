import { KeyboardAction } from '@/background/config/defaultConfig.ts'
import { contentConfig } from '@/content/contentStore.ts'

export interface KeyboardShortcut {
  key: string
  modifiers: [boolean, boolean, boolean]
}

function modifiersMatch(
  event: KeyboardEvent,
  modifiers: [boolean, boolean, boolean]
) {
  return (
    event.ctrlKey === modifiers[0] &&
    event.shiftKey === modifiers[1] &&
    event.altKey === modifiers[2]
  )
}

export function convertKeysToAction(handler: (action: KeyboardAction) => void) {
  return (event: KeyboardEvent) => {
    logger.debug('[KeyHandler] Keydown', event.key, event.code, event)
    const keymap = contentConfig.keymap.get()

    // Find the first matching keymap entry and call the handler
    // This allows for multiple keymaps to be defined, but only the first one to match will be used
    Object.entries(keymap).some(([action, shortcut]) => {
      if (
        event.key.toLowerCase() === shortcut.key.toLowerCase() &&
        modifiersMatch(event, shortcut.modifiers)
      ) {
        handler(action as KeyboardAction)
        return true
      }
    })
  }
}
