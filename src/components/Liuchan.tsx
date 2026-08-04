import { flip, inline, shift, useFloating } from '@floating-ui/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { KeyboardAction } from '@/background/config/defaultConfig'
import { DictionaryEntry } from '@/background/Dictionary'
import { Popup } from '@/components/Popup/Popup.tsx'
import { ContentMessageType } from '@/content/contentMessages'
import { contentConfig, contentStore } from '@/content/contentStore'
import { getHoveredText } from '@/content/getHoveredText'
import { modifierMatches } from '@/content/keyHandler'
import { sendRuntimeMessage } from '@/utils/browser.ts'
import { throttle } from '@/utils/debounce.ts'
import { setThemeCssVars } from '@/utils/theme.ts'

function copyText(entries: DictionaryEntry[]) {
  const config = contentConfig.get()
  const separator = { comma: ',', space: ' ', tab: '\t' }[config.copySeparator]
  const ending = { mac: '\r', unix: '\n', windows: '\r\n' }[config.lineEnding]
  const text = entries
    .slice(0, config.maximumEntries)
    .map((entry) => {
      const pronunciation =
        config.dictionary === 'cantonese'
          ? entry.pronunciations.cantonese?.text
          : entry.pronunciations.mandarin?.[config.pinyinDisplayType]
      const definitions =
        config.dictionary === 'cantonese' && entry.definitions.cantonese.length
          ? entry.definitions.cantonese
          : entry.definitions.mandarin
      return [
        entry.simplified,
        entry.traditional,
        pronunciation ?? '',
        definitions.join('; '),
      ].join(separator)
    })
    .join(ending)
  return navigator.clipboard.writeText(text)
}

export const Liuchan = () => {
  const { floatingStyles, refs } = useFloating({
    middleware: [inline(), shift({ padding: 8 }), flip({ padding: 8 })],
    placement: 'bottom-start',
  })
  const [matchingEntries, setMatchingEntries] = useState<DictionaryEntry[]>([])
  const theme = contentConfig.theme.use()
  const highlightMatch = contentConfig.highlightMatch.use()
  const showPopup = contentStore.showPopup.use()
  const popupPositionMode = contentStore.popupPositionMode.use()
  const popupOffsetY = contentStore.popupOffsetY.use()
  const baseText = useRef('')
  const navigationOffset = useRef(0)
  const longestMatch = useRef(1)
  const requestId = useRef(0)
  const delayTimer = useRef<ReturnType<typeof setTimeout>>()
  const ownedSelection = useRef('')
  const currentHighlight = useRef<(length: number) => void>(() => undefined)

  const clearOwnedSelection = useCallback(() => {
    const selection = window.getSelection()
    if (
      ownedSelection.current &&
      selection?.toString() === ownedSelection.current
    ) {
      selection.removeAllRanges()
    }
    ownedSelection.current = ''
  }, [])

  const showResults = useCallback(
    async (text: string, highlight: (length: number) => void, id: number) => {
      const response = await sendRuntimeMessage({
        text,
        type: ContentMessageType.Search,
      })
      if (id !== requestId.current) return
      if (!response?.entries.length || !response.longestMatchLength) {
        setMatchingEntries([])
        contentStore.showPopup.set(false)
        clearOwnedSelection()
        return
      }
      const display = () => {
        const entries = response.entries.slice(
          0,
          contentConfig.maximumEntries.get()
        )
        longestMatch.current = response.longestMatchLength!
        currentHighlight.current = highlight
        if (
          highlightMatch &&
          (!contentStore.inputActive.get() ||
            contentConfig.highlightMatchInInputs.get())
        ) {
          highlight(response.longestMatchLength!)
          ownedSelection.current = text.slice(0, response.longestMatchLength)
        }
        setMatchingEntries(entries)
        contentStore.matchingEntries.set(entries)
        contentStore.text.set(text)
        contentStore.showPopup.set(true)
      }
      clearTimeout(delayTimer.current)
      const delay = contentConfig.popupDelay.get()
      if (delay) delayTimer.current = setTimeout(display, delay)
      else display()
    },
    [clearOwnedSelection, highlightMatch]
  )

  useEffect(() => {
    const root = contentStore.rootElement.get()
    setThemeCssVars(contentConfig.get(), root)
    return contentConfig.onChange((state) => setThemeCssVars(state, root))
  }, [])

  useEffect(() => {
    if (!highlightMatch) clearOwnedSelection()
  }, [clearOwnedSelection, highlightMatch])

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!modifierMatches(event)) return
      const target = event.target
      contentStore.inputActive.set(
        target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          (target instanceof HTMLElement && target.isContentEditable)
      )
      const result = getHoveredText(event)
      if (!result.text || !result.virtualElement) {
        contentStore.showPopup.set(false)
        clearOwnedSelection()
        return
      }
      if (result.text === baseText.current && navigationOffset.current === 0)
        return
      baseText.current = result.text
      navigationOffset.current = 0
      contentStore.popupOffsetY.set(0)
      refs.setReference(result.virtualElement)
      void showResults(result.text, result.highlight, ++requestId.current)
    }
    const throttled = throttle(handleMouseMove, 25)
    document.addEventListener('mousemove', throttled)
    return () => {
      clearTimeout(delayTimer.current)
      document.removeEventListener('mousemove', throttled)
      clearOwnedSelection()
    }
  }, [clearOwnedSelection, refs, showResults])

  useEffect(() => {
    const navigate = (amount: number) => {
      const nextOffset = Math.max(0, navigationOffset.current + amount)
      if (nextOffset >= baseText.current.length) return
      navigationOffset.current = nextOffset
      const text = baseText.current.slice(nextOffset)
      void showResults(text, currentHighlight.current, ++requestId.current)
    }
    const handleAction = (event: Event) => {
      const action = (event as CustomEvent<KeyboardAction>).detail
      switch (action) {
        case KeyboardAction.HidePopup:
          contentStore.showPopup.set(false)
          clearOwnedSelection()
          break
        case KeyboardAction.AlternatePopupLocation:
          contentStore.popupPositionMode.set(
            ((contentStore.popupPositionMode.get() + 1) % 3) as 0 | 1 | 2
          )
          break
        case KeyboardAction.MovePopupDown:
          contentStore.popupPositionMode.set(0)
          contentStore.popupOffsetY.set(contentStore.popupOffsetY.get() + 20)
          break
        case KeyboardAction.ToggleDefinitions:
          contentStore.definitionsVisible.set(
            !contentStore.definitionsVisible.get()
          )
          break
        case KeyboardAction.PreviousCharacter:
          navigate(-1)
          break
        case KeyboardAction.NextCharacter:
          navigate(1)
          break
        case KeyboardAction.NextWord:
          navigate(longestMatch.current)
          break
        case KeyboardAction.Copy:
          void copyText(contentStore.matchingEntries.get())
          break
        case KeyboardAction.TTS: {
          const entry = contentStore.matchingEntries.get()[0]
          if (entry) {
            void sendRuntimeMessage({
              text:
                contentConfig.ttsDialect.get() === 'zh-CN'
                  ? entry.simplified
                  : entry.traditional,
              type: ContentMessageType.Speak,
            }).catch((error) => logger.error('Text-to-speech failed', error))
          }
        }
      }
    }
    window.addEventListener('liuchan:action', handleAction)
    return () => window.removeEventListener('liuchan:action', handleAction)
  }, [clearOwnedSelection, showResults])

  if (!showPopup || !matchingEntries.length) return null
  const positionedStyle =
    popupPositionMode === 1
      ? { left: 10, position: 'fixed' as const, top: 10 }
      : popupPositionMode === 2
      ? { bottom: 10, position: 'fixed' as const, right: 10 }
      : {
          ...floatingStyles,
          transform: `${
            floatingStyles.transform ?? ''
          } translateY(${popupOffsetY}px)`,
        }

  return (
    <div
      ref={refs.setFloating}
      style={{
        ...positionedStyle,
        boxSizing: 'border-box',
        maxWidth: 'calc(100vw - 16px)',
      }}
    >
      <Popup entries={matchingEntries} theme={theme} />
    </div>
  )
}
