![LiuChan](assets/release/marquee.png)

# LiuChan Chinese Popup Dictionary

LiuChan (_liú chàng_, 流畅) is a Chrome extension that looks up Chinese text as you move the pointer over it. Version 2 is a Manifest V3 rewrite with Mandarin and Cantonese support.

## Features

- Fast mouse-over lookup on page text, inputs, and textareas
- Simplified and traditional Hanzi
- CC-CEDICT Mandarin definitions with Pinyin, tone numbers, or Zhuyin
- CC-Canto definitions and supplemental Jyutping readings
- Mandarin, Cantonese, or combined dictionary display
- Synchronized display settings, themes, and custom colors
- Text highlighting, speech, clipboard export, and navigation hotkeys
- User-triggered dictionary updates without reinstalling the extension

Click the toolbar icon to enable or disable LiuChan. The options page documents the available popup hotkeys.

## Dictionary updates

The extension includes an offline dictionary. In **Settings → Dictionary data**, click **Check for updates** to download the latest CC-CEDICT editor export and the latest published CC-Canto data. Downloads happen only after this button is clicked. New data is validated before it replaces the active dictionary; **Restore bundled data** always returns to the release snapshot.

Dictionary files are data only. LiuChan does not download or execute remote code.

## Development

Requirements: Node.js 22 and pnpm 10.11.0.

```sh
pnpm install --frozen-lockfile
pnpm run compile
pnpm run lint
pnpm run test:unit
pnpm run build
pnpm exec playwright install chromium
pnpm run test:e2e
pnpm run zip
```

Load `.output/chrome-mv3` as an unpacked extension for local testing. The Chrome Store zip is written to `.output/`.

## Data sources and licenses

- [CC-CEDICT](https://cc-cedict.org/) — community-maintained Mandarin dictionary published by MDBG, Creative Commons Attribution-ShareAlike 4.0.
- [CC-Canto](https://cccanto.org/download.html) — Cantonese dictionary, copyright Pleco Inc., Creative Commons Attribution-ShareAlike 3.0.
- CC-CEDICT Cantonese Readings — supplemental readings from the CC-Canto download, copyright Pleco Software Incorporated, Creative Commons Attribution-ShareAlike 3.0.

LiuChan source code is licensed under GPL-3.0.

## Troubleshooting

Chrome cannot inject extensions into internal pages such as `chrome://` or into tabs that have not been reloaded since an extension update. Reload the affected page and try again. If a dictionary update fails, the previously working data remains active.
