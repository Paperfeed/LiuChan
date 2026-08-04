import '@/utils/logger.ts'

import { backgroundMain } from '../background/background.ts'

export default defineBackground({
  main: () => {
    void backgroundMain()
  },
})
