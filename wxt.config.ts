import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'wxt'

import { toolbarIcon } from './src/utils/icons.ts'

// See https://wxt.dev/api/config.html
export default defineConfig({
  manifest: {
    action: {
      default_icon: toolbarIcon.disabled['24'],
      default_title: 'LiuCha Chinese Dictionary',
    },
    permissions: [
      'activeTab',
      'storage',
      'contextMenus',
      'notifications',
      'tts',
    ],
  },
  srcDir: 'src',
  vite: () => ({
    plugins: [tsconfigPaths(), react()],
  }),
})
