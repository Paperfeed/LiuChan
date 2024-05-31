import { DictionaryEntry } from '@/background/Dictionary'
import { Entry } from '@/components/Popup/Entry.tsx'
import { Theme, themes } from '@/components/Popup/themes.ts'

interface PopupProps {
  entries: DictionaryEntry[]
  theme: Theme
}

export const Popup = ({ entries, theme = 'liuchan' }: PopupProps) => {
  const classes = themes[theme]

  return (
    <div className={`liuchan ${classes.container} max-w-[500px]`}>
      {entries.map((result, i) => (
        <Entry key={`entry-${i}`} classes={classes} data={result} />
      ))}
    </div>
  )
}
