import {
  caretPositionFromPoint,
  getEndContainerAndOffset,
  isInputElement,
} from '@/utils/dom'
import { hasChinese } from '@/utils/language'
import {
  getCaretPositionInInput,
  getTextUpToLimit,
  highlightTextInInput,
  highlightTextInNodeRange,
} from '@/utils/selection'

const MAX_TEXT_LENGTH = 20

export function getHoveredText(event: MouseEvent) {
  let highlight: (offset: number) => void = () => null
  let text = ''

  const caretPosition = caretPositionFromPoint(event.clientX, event.clientY)
  if (!caretPosition) {
    return {
      highlight,
      text: null,
    }
  }

  const element = document.elementFromPoint(event.clientX, event.clientY)

  if (isInputElement(element)) {
    const cursorPosition = getCaretPositionInInput(element, event)
    text = element.value.substring(
      cursorPosition,
      Math.min(cursorPosition + MAX_TEXT_LENGTH, element.value.length)
    )

    highlight = (offset) => {
      highlightTextInInput(element, cursorPosition, cursorPosition + offset)
    }
  } else {
    if (caretPosition.startContainer.nodeType === Node.TEXT_NODE) {
      text = getTextUpToLimit(caretPosition, MAX_TEXT_LENGTH)
      highlight = (offset) => {
        const endDetails = getEndContainerAndOffset(
          caretPosition.startContainer,
          caretPosition.startOffset,
          offset
        )
        highlightTextInNodeRange(
          caretPosition.startContainer,
          caretPosition.startOffset,
          endDetails.container,
          endDetails.offset
        )
      }
    }
  }

  if (!text || !hasChinese(text)) {
    return {
      highlight,
      text: null,
    }
  }

  return {
    highlight,
    text,
  }
}
