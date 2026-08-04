import { DictionaryEntry } from '@/background/Dictionary'
import { Entry } from '@/components/Popup/Entry.tsx'
import { Theme, themes } from '@/components/Popup/themes.ts'
import { contentConfig } from '@/content/contentStore'

interface PopupProps {
  entries: DictionaryEntry[]
  theme: Theme
}

export const Popup = ({ entries, theme = 'liuchan' }: PopupProps) => {
  const classes = themes[theme]
  const config = contentConfig.use()
  const custom = config.customColors
  const style = {
    borderRadius: `${config.popupBorderRadius}px`,
    borderWidth: `${config.popupBorderThickness}px`,
    boxShadow: `4px 4px 8px rgb(0 0 0 / ${config.popupShadowOpacity}%)`,
    ...(config.useCustomPopupColors
      ? {
          backgroundColor: custom.background
            ? `rgb(${custom.background})`
            : undefined,
          borderColor: custom.border ? `rgb(${custom.border})` : undefined,
          boxShadow: custom.shadow
            ? `4px 4px 8px rgb(${custom.shadow} / ${config.popupShadowOpacity}%)`
            : undefined,
        }
      : {}),
  }

  return (
    <div
      className={`liuchan ${classes.container} box-border min-w-0 max-w-[min(500px,calc(100vw-16px))] break-words [overflow-wrap:anywhere]`}
      style={style}
    >
      {entries.map((result, i) => (
        <Entry key={`entry-${i}`} classes={classes} data={result} />
      ))}
    </div>
  )
}
