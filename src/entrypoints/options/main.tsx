import '@/utils/logger.ts'
import '@/global.css'

import ReactDOM from 'react-dom/client'

import { Options } from '@/components/Options.tsx'
import { initializeConfig } from '@/background/config/store.ts'

const root = document.getElementById('app')
void initializeConfig().then(() => {
  ReactDOM.createRoot(root!).render(<Options />)
})
