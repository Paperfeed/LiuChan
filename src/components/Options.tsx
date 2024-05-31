import { useEffect } from 'react'

import { configStore } from '@/background/config/store.ts'
import { Checkbox } from '@/components/Options/Checkbox.tsx'
import { ColorCircle } from '@/components/Options/ColorCircle.tsx'
import { Dropdown } from '@/components/Options/Dropdown.tsx'
import { exampleEntry } from '@/components/Options/exampleEntry.ts'
import { Input } from '@/components/Options/Input.tsx'
import { Section } from '@/components/Options/Section.tsx'
import { Popup } from '@/components/Popup/Popup.tsx'
import { Theme, themes } from '@/components/Popup/themes.ts'
import { ContentMessageType } from '@/content/contentMessages.ts'
import { sendRuntimeMessage } from '@/utils/browser.ts'
import { capitalize } from '@/utils/capitalize.ts'

document.documentElement.style.getPropertyValue
export function Options() {
  const currentConfig = configStore.use()
  const currentTheme = configStore.theme.use()

  useEffect(() => {
    configStore.onChange((state) => {
      sendRuntimeMessage({
        config: state,
        type: ContentMessageType.Config,
      })
    })
  }, [])

  return (
    <div className="m-5 font-sans text-base flex flex-col gap-4">
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
          value={currentConfig.dictionary}
        />
        <Dropdown
          label="Theme:"
          onChange={(value) => configStore.theme.set(value)}
          options={(Object.keys(themes) as Theme[]).map((key) => ({
            label: capitalize(key),
            value: key,
          }))}
          value={currentConfig.theme}
        />
        <Dropdown
          label="Pinyin display:"
          onChange={(value) => configStore.pinyinDisplayType.set(value)}
          options={
            [
              {
                label: 'Tone marks',
                value: 'tonemarks',
              },
              {
                label: 'Tone numbers',
                value: 'tonenums',
              },
              {
                label: 'Zhuyin',
                value: 'zhuyin',
              },
            ] as const
          }
          value={currentConfig.pinyinDisplayType}
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
          value={currentConfig.separator}
        />
        <Dropdown
          label="Hanzi Display:"
          onChange={(value) => configStore.hanziDisplaySetting.set(value)}
          options={
            [
              { label: 'Simplified', value: 'simp' },
              { label: 'Traditional', value: 'trad' },
              { label: 'Both (Simplified / Traditional)', value: 'boths' },
              { label: 'Both (Traditional / Simplified)', value: 'botht' },
            ] as const
          }
          value={currentConfig.hanziDisplaySetting}
        />

        <Input
          label="Popup delay:"
          onChange={(value) => configStore.popupDelay.set(parseInt(value))}
          postfix="ms"
          type="number"
          value={currentConfig.popupDelay}
        />

        <Checkbox
          checked={currentConfig.highlightMatch}
          onChange={(checked) => configStore.highlightMatch.set(checked)}
        >
          Highlight text
        </Checkbox>

        <Checkbox
          checked={currentConfig.highlightMatchInInputs}
          onChange={(checked) =>
            configStore.highlightMatchInInputs.set(checked)
          }
        >
          Highlight text in inputs
        </Checkbox>
        {/*<div>Show help on enable</div>*/}
        {/*<div>Scale popup on zoom</div>*/}
      </Section>

      <div className="w-60 -my-3">
        <Popup entries={exampleEntry} theme={currentTheme} />
      </div>

      <Section title="Hotkeys">
        <div>Show popup only when holding modifier:</div>

        <div>Disable hotkeys</div>

        <div className="bg-background p-5 rounded-md">
          Hotkeys:
          <div>A - Switch popup location</div>
          <div>Y - Move popup down</div>
          <div>C - copy to clipboard</div>
          <div>D - hide / show definitions</div>
          <div>B - prev character</div>
          <div>M - next character</div>
          <div>N - next word</div>
          <div>T - text to speech</div>
        </div>
      </Section>

      <Section title="Customize Theme">
        <div>Tone colors</div>
        <div className="flex gap-2 justify-center">
          <ColorCircle
            color={
              currentConfig.customColors?.tone1 ??
              themes[currentTheme].colors.tone1
            }
            cssKey="--tone-1"
            label="Tone 1"
          />
          <ColorCircle
            color={
              currentConfig.customColors?.tone2 ??
              themes[currentTheme].colors.tone2
            }
            cssKey="--tone-2"
            label="Tone 2"
          />
          <ColorCircle
            color={
              currentConfig.customColors?.tone3 ??
              themes[currentTheme].colors.tone3
            }
            cssKey="--tone-3"
            label="Tone 3"
          />
          <ColorCircle
            color={
              currentConfig.customColors?.tone4 ??
              themes[currentTheme].colors.tone4
            }
            cssKey="--tone-4"
            label="Tone 4"
          />
          <ColorCircle
            color={
              currentConfig.customColors?.tone5 ??
              themes[currentTheme].colors.tone5
            }
            cssKey="--tone-5"
            label="Tone 5"
          />
        </div>
        <div>Color hanzi by tone</div>
        <div>Color pinyin by tone</div>
        <div>
          Use custom tone colors <button>Reset</button>
        </div>

        <div>Popup</div>
        <div>Use custom popup colors</div>
        <div>Border thickness</div>
        <div>Border radius</div>
        <div>Drop shadow opacity</div>
      </Section>

      <Section title="Text to speech">
        <div>Dialect: Mandarin / Cantonese</div>
        <div>Speed: 0-1</div>
      </Section>
      <Section title="Copy to clipboard">
        <Dropdown
          label="Line ending:"
          onChange={(value) => configStore.lineEnding.set(value)}
          options={
            [
              {
                label: 'Unix \\n',
                value: 'unix',
              },
              {
                label: 'Windows \\r\\n',
                value: 'windows',
              },
              {
                label: 'Mac \\r',
                value: 'mac',
              },
            ] as const
          }
          value={currentConfig.lineEnding}
        />
        <Dropdown
          label="Separator:"
          onChange={(value) => configStore.copySeparator.set(value)}
          options={
            [
              {
                label: 'Tab',
                value: 'tab',
              },
              {
                label: 'Comma',
                value: 'comma',
              },
              {
                label: 'Space',
                value: 'space',
              },
            ] as const
          }
          value={currentConfig.copySeparator}
        />
        <div className="grid grid-cols-2 items-center">
          <p className="mr-2">Maximum entries:</p>
          <div className="flex flex-row items-center">
            <Input
              onChange={(value) => configStore.popupDelay.set(parseInt(value))}
              type="number"
              value={currentConfig.popupDelay}
            />
            <p className="ml-1">ms</p>
          </div>
        </div>
        <Input
          label="Maximum entries:"
          onChange={(value) => configStore.maximumEntries.set(parseInt(value))}
          value={currentConfig.maximumEntries}
        />
      </Section>
    </div>
  )
}
