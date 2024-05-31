import { DictionaryEntry } from '@/background/Dictionary'
import { themes } from '@/components/Popup/themes.ts'
import { contentConfig } from '@/content/contentStore'

interface EntryProps {
  classes: (typeof themes)['liuchan']
  data: DictionaryEntry
}

function replaceIdenticalCharacters(first: string, second: string) {
  const replacementChar = '\u30FB'
  const firstArr = first.split('')
  const secondArr = second.split('')

  return firstArr
    .map((char, i) => (char === secondArr[i] ? replacementChar : char))
    .join('')
}

export const Entry = ({ classes, data }: EntryProps) => {
  const { simplified, traditional } = data
  const config = contentConfig.use()
  const showSecond =
    simplified !== traditional &&
    ['boths', 'botht'].includes(config.hanziDisplaySetting)
  const simplifiedFirst = ['simp', 'boths'].includes(config.hanziDisplaySetting)
  const [first, second] = simplifiedFirst
    ? [simplified, replaceIdenticalCharacters(traditional, simplified)]
    : [traditional, replaceIdenticalCharacters(simplified, traditional)]

  function getToneColor(tone: number) {
    const toneMap = {
      1: 'text-tone-1',
      2: 'text-tone-2',
      3: 'text-tone-3',
      4: 'text-tone-4',
      5: 'text-tone-5',
    }
    return config.useToneColors
      ? toneMap[tone as keyof typeof toneMap]
      : 'text-tone-1'
  }

  const tonemarks = data.pinyin[config.pinyinDisplayType]?.split(' ') ?? []

  return (
    <div className={classes.entry}>
      <div className="flex flex-wrap items-center">
        <div className={classes.hanzi}>
          {data.pinyin.tones.map((nr, i) => (
            <span key={`hanzi-${i}`} className={getToneColor(nr)}>
              {first.charAt(i)}
            </span>
          ))}
          {showSecond && (
            <>
              <span className={classes.spacer} />
              <span className={classes.brace}>[</span>
              {data.pinyin.tones.map((nr, i) => (
                <span key={`second-${i}`} className={getToneColor(nr)}>
                  {second.charAt(i)}
                </span>
              ))}
              <span className={classes.brace}>]</span>
            </>
          )}
        </div>
        <div className={classes.pinyin}>
          {tonemarks.map((pinyin, i) => {
            const nr = data.pinyin.tones[i]
            return (
              <span key={`pinyin-${i}`} className={getToneColor(nr)}>
                {pinyin}&nbsp;
              </span>
            )
          })}
        </div>
      </div>
      <div className={classes.definition}>
        {data.definitions.map((definition, i) => (
          <span key={`def-${i}`}>
            <span className={classes.bullet}>{i + 1}</span>&nbsp;
            {definition}&nbsp;
          </span>
        ))}
      </div>
    </div>
  )
}
