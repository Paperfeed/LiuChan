import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
import tsconfigPaths from 'vite-tsconfig-paths'

import { toolbarIcon } from './src/utils/icons'

const target = process.env.TARGET || 'chrome'

function generateManifest() {
  const manifest = readJsonFile('src/manifest.json')
  const pkg = readJsonFile('package.json')

  // Sets icons for browser action (so that there's one source of truth)
  manifest['{{firefox}}.browser_action'].default_icon =
    toolbarIcon.disabled['24']
  manifest['{{chrome}}.action'].default_icon = toolbarIcon.disabled

  return {
    description: pkg.description,
    name: pkg.name,
    version: pkg.version,
    ...manifest,
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: false,
  },
  define: {
    __BROWSER__: JSON.stringify(target),
  },
  plugins: [
    tsconfigPaths(),
    react(),
    webExtension({
      // additionalInputs: ['src/content.tsx'],
      manifest: generateManifest,
      webExtConfig: {
        browserConsole: true,
        devtools: true,
        startUrl: 'http://localhost:8080/',
      },
    }),
  ],
})
