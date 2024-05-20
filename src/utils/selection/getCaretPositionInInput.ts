export function getCaretPositionInInput(
  inputElement: HTMLInputElement | HTMLTextAreaElement,
  event: MouseEvent
): number {
  const rect = inputElement.getBoundingClientRect()
  const relativeX = event.clientX - rect.left

  let closestPos = 0
  let closestDiff = Number.POSITIVE_INFINITY

  // Iterate through each character to find the closest position
  for (let pos = 0; pos <= inputElement.value.length; pos++) {
    const span = document.createElement('span')
    span.style.visibility = 'hidden'
    span.style.position = 'absolute'
    span.style.whiteSpace = 'pre'

    const textBeforeCaret = inputElement.value.substring(0, pos)
    const textAfterCaret = inputElement.value.substring(pos)
    const dummyDiv = document.createElement('div')
    dummyDiv.style.position = 'absolute'
    dummyDiv.style.whiteSpace = 'pre'
    dummyDiv.style.font = getComputedStyle(inputElement).font
    dummyDiv.style.left = '-9999px'

    dummyDiv.textContent = textBeforeCaret + '\u200B' + textAfterCaret
    document.body.appendChild(dummyDiv)

    const spanRect = dummyDiv.getBoundingClientRect()
    const diff = Math.abs(
      (spanRect.width * pos) / inputElement.value.length - relativeX
    )

    if (diff < closestDiff) {
      closestDiff = diff
      closestPos = pos
    }

    document.body.removeChild(dummyDiv)
  }

  return closestPos
}
