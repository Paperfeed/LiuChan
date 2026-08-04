import { DictionaryEntry } from '@/background/Dictionary'
import { themes } from '@/components/Popup/themes.ts'
import { contentConfig, contentStore } from '@/content/contentStore'
import { formatDefinition } from '@/utils/dictionary'

interface EntryProps {
  classes: (typeof themes)['liuchan']
  data: DictionaryEntry
}

function replaceIdenticalCharacters(first: string, second: string) {
  return first
    .split('')
    .map((char, index) => (char === second[index] ? '\u30FB' : char))
    .join('')
}

const toneClass = (tone: number) =>
  ({
    1: 'text-tone-1',
    2: 'text-tone-2',
    3: 'text-tone-3',
    4: 'text-tone-4',
    5: 'text-tone-5',
  }[tone] ?? 'text-pinyin')

export const Entry = ({ classes, data }: EntryProps) => {
  const config = contentConfig.use()
  const definitionsVisible = contentStore.definitionsVisible.use()
  const { simplified, traditional } = data
  const simplifiedFirst = ['simp', 'boths'].includes(config.hanziDisplaySetting)
  const showSecond =
    simplified !== traditional &&
    ['boths', 'botht'].includes(config.hanziDisplaySetting)
  const [first, second] = simplifiedFirst
    ? [simplified, replaceIdenticalCharacters(traditional, simplified)]
    : [traditional, replaceIdenticalCharacters(simplified, traditional)]
  const mandarin = data.pronunciations.mandarin
  const cantonese = data.pronunciations.cantonese
  const hanziTones =
    config.dictionary === 'cantonese'
      ? cantonese?.tones ?? []
      : mandarin?.tones ?? cantonese?.tones ?? []

  const renderPronunciation = (
    text: string,
    tones: number[],
    label?: string
  ) => (
    <div className={classes.pinyin}>
      {label && <span className="text-xs opacity-70 mr-1">{label}</span>}
      {text.split(' ').map((syllable, index) => (
        <span
          key={`${label}-${index}`}
          className={config.usePinyinToneColors ? toneClass(tones[index]) : ''}
        >
          {syllable}&nbsp;
        </span>
      ))}
    </div>
  )

  const renderDefinitions = (definitions: string[], label?: string) => {
    if (!definitions.length) return null
    const formatted = definitions.map((definition) =>
      formatDefinition(definition, config.pinyinDisplayType)
    )
    return (
      <div>
        {label && <span className="font-bold mr-1">{label}:</span>}
        {config.separator === 'num'
          ? formatted.map((definition, index) => (
              <span key={`${label}-${index}`}>
                <span className={classes.bullet}>{index + 1}</span>&nbsp;
                {definition}&nbsp;
              </span>
            ))
          : formatted.join(config.separator === 'semi' ? '; ' : ' / ')}
      </div>
    )
  }

  return (
    <div className={`entry ${classes.entry}`}>
      <div className="flex flex-wrap items-center">
        <div className={classes.hanzi}>
          {[...first].map((character, index) => (
            <span
              key={`hanzi-${index}`}
              className={
                config.useHanziToneColors ? toneClass(hanziTones[index]) : ''
              }
            >
              {character}
            </span>
          ))}
          {showSecond && (
            <>
              <span className={classes.spacer} />
              <span className={classes.brace}>[</span>
              {[...second].map((character, index) => (
                <span
                  key={`second-${index}`}
                  className={
                    config.useHanziToneColors
                      ? toneClass(hanziTones[index])
                      : ''
                  }
                >
                  {character}
                </span>
              ))}
              <span className={classes.brace}>]</span>
            </>
          )}
        </div>
        {config.dictionary !== 'cantonese' &&
          mandarin &&
          renderPronunciation(
            mandarin[config.pinyinDisplayType],
            mandarin.tones,
            config.dictionary === 'both' ? 'M' : undefined
          )}
        {config.dictionary !== 'mandarin' &&
          cantonese &&
          renderPronunciation(
            cantonese.text,
            cantonese.tones,
            config.dictionary === 'both' ? 'C' : undefined
          )}
      </div>
      {definitionsVisible && (
        <div className={classes.definition}>
          {config.dictionary !== 'cantonese' &&
            renderDefinitions(
              data.definitions.mandarin,
              config.dictionary === 'both' ? 'Mandarin' : undefined
            )}
          {config.dictionary !== 'mandarin' &&
            renderDefinitions(
              data.definitions.cantonese.length
                ? data.definitions.cantonese
                : data.definitions.mandarin,
              config.dictionary === 'both' ? 'Cantonese' : undefined
            )}
        </div>
      )}
    </div>
  )
}
