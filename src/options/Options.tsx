import '@/utils/logger'
import '@/global.css'

import { configStore } from '@/background/config/store'
import { Checkbox } from '@/components/Checkbox'

export function Options() {
  return (
    <div>
      <h1>Option</h1>

      <div className="General"></div>
      <div>Dictionary: Mandarin / Cantonese / Both</div>
      <div>Theme: liuchan pleco</div>
      <div>Pronunciation: Tone marks / tone numbers / zhuyin / jyutping</div>
      <div>Definition separator: Numbers / Semicolon / Slash</div>
      <div>Hanzi display: Simplified / Traditional / Both</div>
      <div>Popup delay: 0ms</div>
      <Checkbox onChange={configStore.content.highlightMatch.set}>
        Highlight Text
      </Checkbox>
      <div>Highlight text in inputs</div>
      <div>Show help on enable</div>
      <div>Scale popup on zoom</div>

      <div className="keyboard"></div>
      <div>Show popup on key: None / Ctrl / Alt / Shift or combination</div>
      <div>Disable hotkeys</div>

      <div>Hotkeys:</div>
      <div>A - Popup to alternate location</div>
      <div>Y - Move popup down</div>
      <div>C - copy to clipboard</div>
      <div>D - hide / show definitions</div>
      <div>B - prev character</div>
      <div>M - next character</div>
      <div>N - next word</div>
      <div>T - text to speech</div>

      <div>Customize Theme</div>

      <div>Tone colors</div>
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

      <div>Text to speech</div>
      <div>Dialect: Mandarin / Cantonese</div>
      <div>Speed: 0-1</div>

      <div>Copy to clipboard</div>
      <div>Line ending: Unix \n / Windows \r\n / Mac \r</div>
      <div>Field separator: Tab \ Comma \ Space</div>
      <div>Maximum entries: number</div>
    </div>
  )
}
