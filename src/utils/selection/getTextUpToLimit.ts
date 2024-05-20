import { nextNode } from '@/utils/dom'

/**
 * Get the text up to the limit from the caret position (spanning multiple nodes)
 * @param caretPosition
 * @param limit
 */
export function getTextUpToLimit(caretPosition: Range, limit: number): string {
  let text = ''
  let currentNode: Node | null = caretPosition.startContainer
  let currentOffset = caretPosition.startOffset

  while (text.length < limit && currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const remainingText =
        currentNode.textContent?.substring(currentOffset) || ''
      const charsToTake = Math.min(remainingText.length, limit - text.length)
      text += remainingText.substring(0, charsToTake)
      currentOffset = 0
    }

    if (text.length < limit) {
      currentNode = nextNode(currentNode)
    }
  }

  return text
}
