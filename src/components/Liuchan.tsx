import { flip, inline, shift, useFloating } from '@floating-ui/react'
import { useEffect, useState } from 'react'

import { DictionaryEntry } from '@/background/Dictionary'
import { Popup } from '@/components/Popup/Popup'
import { ContentMessageType } from '@/content/contentMessages'
import { contentConfig, contentStore } from '@/content/contentStore'
import { getHoveredText } from '@/content/getHoveredText'
import { sendRuntimeMessage } from '@/utils/browser'
import { throttle } from '@/utils/debounce'

export const Liuchan = () => {
  const { floatingStyles, refs } = useFloating({
    middleware: [inline(), shift(), flip()],
    placement: 'bottom-start',
  })
  const [matchingEntries, setMatchingEntries] = useState<DictionaryEntry[]>([])
  const theme = contentConfig.theme.get() ?? 'liuchan'
  const highlightMatch = contentConfig.highlightMatch.use()
  const showPopup = contentStore.showPopup.get()

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { highlight, text, virtualElement } = getHoveredText(e)
      if (!text) {
        setMatchingEntries([])

        // Todo only remove ranges if the popup created one itself
        if (highlightMatch) {
          window.getSelection()?.removeAllRanges()
        }
        contentStore.showPopup.set(false)
        return
      }

      // There is some more optimization that can be done here by stripping characters
      // such as spaces, newlines, etc. But for now, this is good enough.
      if (text === contentStore.text.get()) return

      sendRuntimeMessage({
        text,
        type: ContentMessageType.Search,
      }).then((response) => {
        if (
          !response ||
          !response.longestMatchLength ||
          !response.entries.length
        ) {
          // No results found in dictionary
          return
        }

        if (highlightMatch) {
          highlight(response.longestMatchLength)
        }
        setMatchingEntries(response.entries)
        contentStore.showPopup.set(true)
        contentStore.text.set(text)

        refs.setReference(virtualElement)
      })
    }

    const debouncedHandleMouseMove = throttle(handleMouseMove, 25)
    document.addEventListener('mousemove', debouncedHandleMouseMove)

    return () => {
      document.removeEventListener('mousemove', debouncedHandleMouseMove)
    }
  }, [])

  if (!showPopup || matchingEntries.length === 0) return null

  return (
    <div ref={refs.setFloating} style={floatingStyles}>
      <Popup entries={matchingEntries} theme={theme} />
    </div>
  )
}
