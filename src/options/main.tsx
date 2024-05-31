import '@/utils/logger'
import '@/global.css'

import ReactDOM from 'react-dom/client'

import { Options } from '@/options/Options'

const root = document.getElementById('app')
ReactDOM.createRoot(root!).render(<Options />)
