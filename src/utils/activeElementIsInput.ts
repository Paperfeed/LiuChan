const isInputElement = (
  element: Element | null
): element is HTMLInputElement => {
  return element instanceof HTMLInputElement
}

export function activeElementIsInput() {
  // Available types: radio|checkbox|undefined|file|range|week|month|submit|reset|number|date
  // Actual useful elements: text|email|password|search|tel|url|number
  const activeElement = document.activeElement

  if (!isInputElement(activeElement)) return false

  return [
    'text',
    'email',
    'password',
    'search',
    'tel',
    'url',
    'number',
  ].includes(activeElement.type)
}
