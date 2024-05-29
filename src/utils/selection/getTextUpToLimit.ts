import { nextNode } from '@/utils/dom'

/**
 * Get the text up to the limit from the caret position (spanning multiple nodes)
 * @param caretPosition
 * @param limit
 */
export function getTextUpToLimit(caretPosition: Range, limit: number) {
  let text = ''
  let currentNode: Node | null = caretPosition.startContainer
  let currentOffset = caretPosition.startOffset

  // Create a new Range to calculate the bounding rect
  const range = document.createRange()
  range.setStart(caretPosition.startContainer, caretPosition.startOffset)

  while (text.length < limit && currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const remainingText =
        currentNode.textContent?.substring(currentOffset) || ''
      const charactersToTake = Math.min(
        remainingText.length,
        limit - text.length
      )
      text += remainingText.substring(0, charactersToTake)
      currentOffset += charactersToTake

      if (text.length >= limit) {
        range.setEnd(currentNode, currentOffset)
      }
    }

    if (text.length < limit) {
      currentNode = nextNode(currentNode)
      if (currentNode && currentNode.nodeType === Node.TEXT_NODE) {
        currentOffset = 0
      }
    }
  }

  if (text.length < limit && currentNode) {
    // If we reached the end of nodes before reaching the limit
    range.setEnd(currentNode, currentOffset)
  }

  return text
}
