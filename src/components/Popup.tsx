import { useFloating } from '@floating-ui/react'
import { useEffect } from 'react'

import { contentStore } from '@/content'
import { getHoveredText } from '@/content/getHoveredText'
import { sendRuntimeMessage } from '@/utils/browser'
import { throttle } from '@/utils/debounce'

export const Popup = () => {
  const { floatingStyles, refs } = useFloating()
  const results = contentStore.definitions.use()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { highlight, text } = getHoveredText(e)
      if (!text) return

      sendRuntimeMessage({
        text,
        type: 'xsearch',
      }).then((response) => {
        if (!response.matchLength || !response.definitions.length) return
        contentStore.definitions.set(response.definitions)
        highlight(response.matchLength)
      })
    }

    const debouncedHandleMouseMove = throttle(handleMouseMove, 25)
    document.addEventListener('mousemove', debouncedHandleMouseMove)

    return () => {
      document.removeEventListener('mousemove', debouncedHandleMouseMove)
    }
  }, [])

  return (
    <div ref={refs.setFloating} style={floatingStyles}>
      <div style={{ background: 'aliceblue', maxWidth: '120px' }}>
        {JSON.stringify(results, null, 2)}
      </div>
    </div>
  )
}
