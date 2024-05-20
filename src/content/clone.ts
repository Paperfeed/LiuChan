const CLONE_ID = 'liuchan-clone'

export function createClone(element: Element) {
  const computedStyle = window.getComputedStyle(element)
  let style = ''
  for (const key of computedStyle) {
    style += `${key}: ${computedStyle[key]}`
  }

  const offset = getOffset(element)
  let clone = document.getElementById(CLONE_ID)
  if (!clone) {
    clone = document.createElement('div')
    clone.id = CLONE_ID
    document.body.appendChild(clone)
  }

  clone.innerHTML = element.innerHTML
  clone.style.cssText = style
  clone.style.position = 'absolute'
  clone.style.top = `${offset.top}px`
  clone.style.left = `${offset.left}px`
  clone.style.opacity = '0'
  clone.style.zIndex = '2147483646'
  if (element.nodeName === 'TEXTAREA' && computedStyle.overflow === 'visible') {
    clone.style.overflow = 'auto'
  }

  clone.scrollTop = element.scrollTop
  clone.scrollLeft = element.scrollLeft

  return clone
}

function getOffset(element: Element) {
  const scrollTop =
    window.pageYOffset ||
    document.documentElement.scrollTop ||
    document.body.scrollTop
  const scrollLeft =
    window.pageXOffset ||
    document.documentElement.scrollLeft ||
    document.body.scrollLeft

  const clientTop =
    document.documentElement.clientTop || document.body.clientTop || 0
  const clientLeft =
    document.documentElement.clientLeft || document.body.clientLeft || 0

  const rect = element.getBoundingClientRect()
  const top = Math.round(rect.top + scrollTop - clientTop)
  const left = Math.round(rect.left + scrollLeft - clientLeft)

  return { left, top }
}

export function destroyClone() {
  const clone = document.getElementById(CLONE_ID)
  if (clone) {
    clone.remove()
  }
}
