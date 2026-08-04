export function highlightTextInNodeRange(
  startNode: Node,
  startOffset: number,
  endNode: Node,
  endOffset: number
) {
  const range = document.createRange()
  range.setStart(startNode, startOffset)
  range.setEnd(endNode, endOffset)

  const selection = window.getSelection()
  if (selection) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export function highlightTextInInput(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  start: number,
  end: number
) {
  inputElement.setSelectionRange(start, end)
  inputElement.focus()
}
