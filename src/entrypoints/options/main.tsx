import '@/utils/logger.ts'
import '@/global.css'

import ReactDOM from 'react-dom/client'

import { Options } from '@/components/Options.tsx'

const root = document.getElementById('app')
ReactDOM.createRoot(root!).render(<Options />)
