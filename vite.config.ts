import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'
import tsconfigPaths from 'vite-tsconfig-paths'

import { toolbarIcon } from './src/utils/icons'

const target = process.env.VITE_BROWSER ?? 'chrome'

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
    minify: process.env.DEV !== 'true',
    sourcemap: process.env.DEV === 'true',
  },
  plugins: [
    tsconfigPaths(),
    react(),
    webExtension({
      // additionalInputs: ['src/options/options.tsx'],
      browser: target,
      manifest: generateManifest,
      webExtConfig: {
        browserConsole: true,
        devtools: true,
        startUrl: 'http://localhost:8080/',
      },
    }),
  ],
})
