export function isInputElement(
  element: Element | null
): element is HTMLInputElement | HTMLTextAreaElement {
  return Boolean(element && ['INPUT', 'TEXTAREA'].includes(element.tagName))
}

export function caretPositionFromPoint(x: number, y: number): Range | null {
  // Use the appropriate method based on browser compatibility
  if (document.caretRangeFromPoint) {
    return document.caretRangeFromPoint(x, y)
  } else if ((document as any).caretPositionFromPoint) {
    const pos = (document as any).caretPositionFromPoint(x, y)
    if (pos) {
      const range = document.createRange()
      range.setStart(pos.offsetNode, pos.offset)
      range.setEnd(pos.offsetNode, pos.offset)
      return range
    }
  }
  return null
}

export function nextNode(node: Node | null): Node | null {
  if (node?.firstChild) {
    return node.firstChild
  }
  while (node) {
    if (node.nextSibling) {
      return node.nextSibling
    }
    node = node.parentNode
  }
  return null
}

export function getEndContainerAndOffset(
  startNode: Node,
  startOffset: number,
  length: number
): { container: Node; offset: number } {
  let remainingLength = length
  let currentNode: Node | null = startNode
  let currentOffset = startOffset

  while (remainingLength > 0 && currentNode) {
    if (currentNode.nodeType === Node.TEXT_NODE) {
      const nodeLength = (currentNode.textContent?.length || 0) - currentOffset
      if (remainingLength <= nodeLength) {
        return {
          container: currentNode,
          offset: currentOffset + remainingLength,
        }
      }
      remainingLength -= nodeLength
    }

    currentNode = nextNode(currentNode)
    currentOffset = 0 // Reset offset after the initial node
  }

  return { container: currentNode || startNode, offset: remainingLength }
}
