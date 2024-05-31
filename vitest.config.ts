import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'
import { WxtVitest } from 'wxt/testing'

// https://github.com/wxt-dev/wxt-examples/tree/main/examples/vanilla-vitest#readme
export default defineConfig({
  plugins: [tsconfigPaths(), WxtVitest()],
  test: {
    mockReset: true,
    restoreMocks: true,
    setupFiles: ['./tests/setup.ts'],
  },
  // If any dependencies rely on webextension-polyfill, add them here to the `ssr.noExternal` option.
  // Example:
  // ssr: {
  //   noExternal: ['@webext-core/storage'],
  // },
})
