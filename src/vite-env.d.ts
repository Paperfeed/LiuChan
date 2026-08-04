/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BROWSER: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
