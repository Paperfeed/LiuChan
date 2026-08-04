import { useEffect, useState } from 'react'
import { IColor } from 'react-color-palette'

import { LiuChanOptions } from '@/background/config/defaultConfig.ts'
import { configStore } from '@/background/config/store.ts'
import { DictionaryMetadata } from '@/background/dictionaryData'
import { DictionaryEntry } from '@/background/Dictionary.ts'
import { Checkbox } from '@/components/Options/Checkbox.tsx'
import { ColorCircle } from '@/components/Options/ColorCircle.tsx'
import { Dropdown } from '@/components/Options/Dropdown.tsx'
import { Input } from '@/components/Options/Input.tsx'
import { Section } from '@/components/Options/Section.tsx'
import { Popup } from '@/components/Popup/Popup.tsx'
import { Theme, themes } from '@/components/Popup/themes.ts'
import { ContentMessageType } from '@/content/contentMessages.ts'
import { contentConfig } from '@/content/contentStore.ts'
import { sendRuntimeMessage } from '@/utils/browser.ts'
import { capitalize } from '@/utils/capitalize.ts'
import { debounce } from '@/utils/debounce.ts'
import { parseMandarin } from '@/utils/dictionary.ts'
import { setThemeCssVars } from '@/utils/theme.ts'

const example: DictionaryEntry[] = [
  {
    definitions: {
      cantonese: [],
      mandarin: ['LiuChan Popup Dictionary'],
    },
    length: 6,
    pronunciations: {
      mandarin: parseMandarin('liu2 chang4 tan2 chuang1 ci2 dian3'),
    },
    simplified: '流畅弹窗词典',
    traditional: '流畅弹窗词典',
  },
  {
    definitions: {
      cantonese: [],
      mandarin: ['flowing (of speech, writing)', 'fluent', 'smooth and easy'],
    },
    length: 2,
    pronunciations: {
      mandarin: parseMandarin('liu2 chang4'),
    },
    simplified: '流畅',
    traditional: '流暢',
  },
  {
    definitions: {
      cantonese: [],
      mandarin: ['pop-up window (computing)'],
    },
    length: 2,
    pronunciations: {
      mandarin: parseMandarin('tan2 chuang1'),
    },
    simplified: '弹窗',
    traditional: '彈窗',
  },
  {
    definitions: {
      cantonese: [],
      mandarin: ['dictionary (of Chinese compound words)'],
    },
    length: 2,
    pronunciations: {
      mandarin: parseMandarin('ci2 dian3'),
    },
    simplified: '词典',
    traditional: '詞典',
  },
]

const hotkeys = [
  ['A', 'Alternate popup location'],
  ['Y', 'Move popup down'],
  ['C', 'Copy to clipboard'],
  ['D', 'Hide or show definitions'],
  ['B', 'Previous character'],
  ['M', 'Next character'],
  ['N', 'Next word'],
  ['T', 'Text-to-speech'],
  ['Esc', 'Hide popup'],
] as const

const rgb = (color: IColor) =>
  `${Math.round(color.rgb.r)} ${Math.round(color.rgb.g)} ${Math.round(
    color.rgb.b
  )}`

const changeColor = (key: keyof LiuChanOptions['customColors']) =>
  debounce(
    (color: IColor) => configStore.customColors[key]?.set(rgb(color)),
    50
  )

const numberValue = (value: string, fallback: number) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function Options() {
  const config = configStore.use()
  const [metadata, setMetadata] = useState<DictionaryMetadata>()
  const [speechState, setSpeechState] = useState('')
  const [updateState, setUpdateState] = useState('')

  useEffect(() => {
    contentConfig.set(configStore.get())
    const stopMessages = configStore.onChange((state) => {
      contentConfig.set(state)
      void sendRuntimeMessage({
        config: state,
        type: ContentMessageType.Config,
      })
    })
    const stopTheme = configStore.onChange((state) =>
      setThemeCssVars(state, document.documentElement)
    )
    setThemeCssVars(configStore.get(), document.documentElement)
    void sendRuntimeMessage({ type: ContentMessageType.DictionaryStatus }).then(
      setMetadata
    )
    return () => {
      stopMessages()
      stopTheme()
    }
  }, [])

  const updateDictionaries = async () => {
    setUpdateState('Downloading and validating dictionaries…')
    try {
      const result = await sendRuntimeMessage({
        type: ContentMessageType.DictionaryUpdate,
      })
      setMetadata(result)
      setUpdateState('Dictionaries updated successfully.')
    } catch (error) {
      setUpdateState(
        `Update failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  const restoreDictionaries = async () => {
    await sendRuntimeMessage({ type: ContentMessageType.DictionaryRestore })
    setMetadata(undefined)
    setUpdateState('Restored the dictionary bundled with LiuChan.')
  }

  const testSpeech = async () => {
    setSpeechState('Testing voice…')
    const samples = { 'zh-CN': '你好', 'zh-HK': '你好', 'zh-TW': '你好' }
    try {
      const voice = await sendRuntimeMessage({
        text: samples[config.ttsDialect],
        type: ContentMessageType.Speak,
      })
      setSpeechState(`Speech completed using ${voice}.`)
    } catch (error) {
      setSpeechState(
        `Speech failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    }
  }

  const color = (key: keyof LiuChanOptions['customColors'], fallback: string) =>
    config.customColors[key] ?? fallback

  return (
    <main className="m-5 mx-auto max-w-3xl font-sans text-base flex flex-col gap-4">
      <h1 className="text-3xl font-bold">LiuChan settings</h1>
      <Section title="General">
        <Dropdown
          label="Dictionary:"
          onChange={(value) => configStore.dictionary.set(value)}
          options={
            [
              { label: 'Mandarin', value: 'mandarin' },
              { label: 'Cantonese', value: 'cantonese' },
              { label: 'Both', value: 'both' },
            ] as const
          }
          value={config.dictionary}
        />
        <Dropdown
          label="Theme:"
          onChange={(value) => configStore.theme.set(value)}
          options={(Object.keys(themes) as Theme[]).map((value) => ({
            label: capitalize(value),
            value,
          }))}
          value={config.theme}
        />
        <Dropdown
          label="Pinyin display:"
          onChange={(value) => configStore.pinyinDisplayType.set(value)}
          options={
            [
              { label: 'Tone marks', value: 'tonemarks' },
              { label: 'Tone numbers', value: 'tonenums' },
              { label: 'Zhuyin', value: 'zhuyin' },
            ] as const
          }
          value={config.pinyinDisplayType}
        />
        <Dropdown
          label="Definition separator:"
          onChange={(value) => configStore.separator.set(value)}
          options={
            [
              { label: 'Numbers', value: 'num' },
              { label: 'Semicolon', value: 'semi' },
              { label: 'Slash', value: 'slash' },
            ] as const
          }
          value={config.separator}
        />
        <Dropdown
          label="Hanzi display:"
          onChange={(value) => configStore.hanziDisplaySetting.set(value)}
          options={
            [
              { label: 'Simplified', value: 'simp' },
              { label: 'Traditional', value: 'trad' },
              { label: 'Both (Simplified / Traditional)', value: 'boths' },
              { label: 'Both (Traditional / Simplified)', value: 'botht' },
            ] as const
          }
          value={config.hanziDisplaySetting}
        />
        <Input
          label="Popup delay:"
          max={2000}
          min={0}
          onChange={(value) =>
            configStore.popupDelay.set(numberValue(value, 0))
          }
          postfix="ms"
          type="number"
          value={config.popupDelay}
        />
        <Checkbox
          checked={config.highlightMatch}
          onChange={configStore.highlightMatch.set}
        >
          Highlight matched page text
        </Checkbox>
        <Checkbox
          checked={config.highlightMatchInInputs}
          onChange={configStore.highlightMatchInInputs.set}
        >
          Highlight matches in inputs
        </Checkbox>
      </Section>

      <div className="w-auto -my-3">
        <Popup entries={example} theme={config.theme} />
      </div>

      <Section title="Customize theme">
        <div className="font-semibold">Tone colors</div>
        <div className="flex gap-2 justify-center">
          {([1, 2, 3, 4, 5] as const).map((tone) => {
            const key = `tone${tone}` as const
            return (
              <ColorCircle
                key={key}
                color={color(key, themes[config.theme].colors[key])}
                label={`Tone ${tone}`}
                onChange={changeColor(key)}
                onReset={() => configStore.customColors[key]?.set(undefined)}
              />
            )
          })}
        </div>
        <Checkbox
          checked={config.useHanziToneColors}
          onChange={configStore.useHanziToneColors.set}
        >
          Color Hanzi by tone
        </Checkbox>
        <Checkbox
          checked={config.usePinyinToneColors}
          onChange={configStore.usePinyinToneColors.set}
        >
          Color pronunciation by tone
        </Checkbox>
        <Checkbox
          checked={config.useCustomPopupColors}
          onChange={configStore.useCustomPopupColors.set}
        >
          Use custom popup colors
        </Checkbox>
        <div className="flex gap-4 justify-center">
          <ColorCircle
            color={color('background', themes[config.theme].colors.background)}
            label="Background"
            onChange={changeColor('background')}
            onReset={() => configStore.customColors.background?.set(undefined)}
          />
          <ColorCircle
            color={color('border', themes[config.theme].colors.border)}
            label="Border"
            onChange={changeColor('border')}
            onReset={() => configStore.customColors.border?.set(undefined)}
          />
          <ColorCircle
            color={color('shadow', '0 0 0')}
            label="Shadow"
            onChange={changeColor('shadow')}
            onReset={() => configStore.customColors.shadow?.set(undefined)}
          />
        </div>
        <Input
          label="Border thickness:"
          max={10}
          min={0}
          onChange={(v) =>
            configStore.popupBorderThickness.set(numberValue(v, 2))
          }
          postfix="px"
          type="number"
          value={config.popupBorderThickness}
        />
        <Input
          label="Border radius:"
          max={24}
          min={0}
          onChange={(v) => configStore.popupBorderRadius.set(numberValue(v, 8))}
          postfix="px"
          type="number"
          value={config.popupBorderRadius}
        />
        <Input
          label="Shadow opacity:"
          max={100}
          min={0}
          onChange={(v) =>
            configStore.popupShadowOpacity.set(numberValue(v, 25))
          }
          postfix="%"
          type="number"
          value={config.popupShadowOpacity}
        />
      </Section>

      <Section title="Hotkeys">
        <Dropdown
          label="Show popup modifier:"
          onChange={configStore.showOnModifier.set}
          options={
            [
              { label: 'None', value: 'none' },
              { label: 'Ctrl', value: 'ctrl' },
              { label: 'Alt', value: 'alt' },
              { label: 'Ctrl + Alt', value: 'ctrl-alt' },
            ] as const
          }
          value={config.showOnModifier}
        />
        <Checkbox
          checked={config.disableHotkeys}
          onChange={configStore.disableHotkeys.set}
        >
          Disable popup hotkeys
        </Checkbox>
        <div className="overflow-hidden rounded-md border border-black/10 bg-background text-sm">
          {hotkeys.map(([key, action], index) => (
            <div
              className={`grid grid-cols-[4rem_1fr] items-center gap-3 px-4 py-2 ${
                index % 2 ? 'bg-black/[0.04]' : ''
              }`}
              key={key}
            >
              <kbd className="w-fit min-w-8 rounded border border-black/20 bg-white px-2 py-0.5 text-center font-mono font-bold shadow-sm">
                {key}
              </kbd>
              <span>{action}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Text to speech">
        <Dropdown
          label="Dialect:"
          onChange={configStore.ttsDialect.set}
          options={
            [
              { label: 'Mandarin (Mainland)', value: 'zh-CN' },
              { label: 'Mandarin (Taiwan)', value: 'zh-TW' },
              { label: 'Cantonese (Hong Kong)', value: 'zh-HK' },
            ] as const
          }
          value={config.ttsDialect}
        />
        <Input
          label="Speed:"
          max={2}
          min={0.1}
          step={0.1}
          onChange={(v) => configStore.ttsSpeed.set(numberValue(v, 0.9))}
          type="number"
          value={config.ttsSpeed}
        />
        <div className="flex items-center gap-3">
          <button
            className="rounded bg-blue-700 px-3 py-2 text-white"
            onClick={() => void testSpeech()}
          >
            Test voice
          </button>
          {speechState && <p role="status">{speechState}</p>}
        </div>
      </Section>

      <Section title="Copy to clipboard">
        <Dropdown
          label="Line ending:"
          onChange={configStore.lineEnding.set}
          options={
            [
              { label: 'Unix \\n', value: 'unix' },
              { label: 'Windows \\r\\n', value: 'windows' },
              { label: 'Mac \\r', value: 'mac' },
            ] as const
          }
          value={config.lineEnding}
        />
        <Dropdown
          label="Field separator:"
          onChange={configStore.copySeparator.set}
          options={
            [
              { label: 'Tab', value: 'tab' },
              { label: 'Comma', value: 'comma' },
              { label: 'Space', value: 'space' },
            ] as const
          }
          value={config.copySeparator}
        />
        <Input
          label="Maximum entries:"
          max={50}
          min={1}
          onChange={(v) => configStore.maximumEntries.set(numberValue(v, 7))}
          type="number"
          value={config.maximumEntries}
        />
      </Section>

      <Section title="Dictionary data">
        <p>
          {metadata
            ? `Downloaded ${new Date(
                metadata.installedAt
              ).toLocaleString()} — CC-CEDICT: ${
                metadata.versions.cedict
              }; CC-Canto: ${metadata.versions.canto}`
            : 'Using the dictionary bundled with LiuChan.'}
        </p>
        <p className="text-sm">
          Updates are downloaded only when you click the button. Failed
          validation keeps your current dictionary.
        </p>
        <ul className="list-disc pl-5 text-sm">
          <li>
            Mandarin definitions:{' '}
            <a
              className="text-blue-700 underline"
              href="https://cc-cedict.org/"
              rel="noreferrer"
              target="_blank"
            >
              CC-CEDICT
            </a>
            , CC BY-SA 4.0.
          </li>
          <li>
            Cantonese definitions:{' '}
            <a
              className="text-blue-700 underline"
              href="https://cccanto.org/download.html"
              rel="noreferrer"
              target="_blank"
            >
              CC-Canto
            </a>{' '}
            by Pleco Inc., CC BY-SA 3.0.
          </li>
          <li>
            Cantonese readings: CC-CEDICT Cantonese Readings by Pleco Software
            Incorporated, CC BY-SA 3.0.
          </li>
        </ul>
        <div className="flex gap-2">
          <button
            className="px-3 py-2 rounded bg-blue-700 text-white"
            onClick={() => void updateDictionaries()}
          >
            Check for updates
          </button>
          {metadata && (
            <button
              className="px-3 py-2 rounded bg-white"
              onClick={() => void restoreDictionaries()}
            >
              Restore bundled data
            </button>
          )}
        </div>
        {updateState && <p role="status">{updateState}</p>}
      </Section>
    </main>
  )
}
