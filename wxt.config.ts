import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'wxt'

import { toolbarIcon } from './src/utils/icons.ts'

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    action: {
      default_icon: toolbarIcon.disabled['24'],
      default_title: 'LiuChan Chinese Dictionary',
    },
    description:
      'A lightweight Mandarin and Cantonese mouse-over dictionary for Chinese.',
    host_permissions: ['https://cc-cedict.org/*', 'https://cccanto.org/*'],
    name: 'LiuChan Chinese Popup Dictionary',
    permissions: ['storage', 'unlimitedStorage', 'tts'],
    short_name: 'LiuChan',
  },
  publicDir: 'src/public',
  webExt: {
    chromiumArgs: ['--auto-open-devtools-for-tabs'],
    openConsole: true,
    openDevtools: true,
    startUrls: ['http://localhost:8080'],
  },
  srcDir: 'src',
  vite: () => ({
    plugins: [tsconfigPaths(), react()],
  }),
})
