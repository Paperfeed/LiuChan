import { VirtualElement } from '@floating-ui/react'

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

export function getHoveredText(event: MouseEvent, maxLength = MAX_TEXT_LENGTH) {
  let highlight: (offset: number) => void = () => null

  let text = ''
  const range = document.createRange()

  const caretPosition = caretPositionFromPoint(event.clientX, event.clientY)
  if (!caretPosition) {
    return {
      highlight,
      text: null,
    }
  }

  const element = document.elementFromPoint(event.clientX, event.clientY)
  if (
    !element ||
    element.classList.contains('liuchan') ||
    element.closest('.liuchan')
  ) {
    return {
      highlight,
      text: null,
    }
  }

  if (isInputElement(element)) {
    const cursorPosition = getCaretPositionInInput(element, event)
    // range.setStart(element.firstChild, cursorPosition)
    text = element.value.substring(
      cursorPosition,
      Math.min(cursorPosition + maxLength, element.value.length)
    )

    highlight = (offset) => {
      return highlightTextInInput(
        element,
        cursorPosition,
        cursorPosition + offset
      )
    }
  } else {
    if (caretPosition.startContainer.nodeType === Node.TEXT_NODE) {
      text = getTextUpToLimit(caretPosition, maxLength)
      range.setStart(caretPosition.startContainer, caretPosition.startOffset)
      range.setEnd(
        caretPosition.endContainer,
        Math.min(
          caretPosition.endContainer.textContent?.length ??
            Number.POSITIVE_INFINITY,
          caretPosition.endOffset
        )
      )

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

  if (!text) {
    /*|| !hasChinese(text)) {*/
    return {
      highlight,
      text: null,
    }
  }

  const virtualElement = {
    getBoundingClientRect: () => range.getBoundingClientRect(),
    getClientRects: () => range.getClientRects(),
  } as VirtualElement

  return {
    highlight,
    text,
    virtualElement,
  }
}
