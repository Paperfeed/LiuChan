interface TtsVoice {
  lang?: string
  voiceName?: string
}

export function selectVoice(voices: TtsVoice[], language: string) {
  const locale = language.toLowerCase()
  const exact = voices.find((voice) => voice.lang?.toLowerCase() === locale)
  if (exact) return exact
  const baseLanguage = locale.split('-')[0]
  return voices.find(
    (voice) => voice.lang?.toLowerCase().split('-')[0] === baseLanguage
  )
}

export async function speak(text: string, language: string, rate: number) {
  const chromeApi = (globalThis as any).chrome
  if (!chromeApi?.tts) throw new Error('Chrome text-to-speech is unavailable')
  const voices = await new Promise<TtsVoice[]>((resolve) =>
    chromeApi.tts.getVoices((available: TtsVoice[]) => resolve(available ?? []))
  )
  const voice = selectVoice(voices, language)

  await new Promise<void>((resolve, reject) => {
    chromeApi.tts.stop()
    chromeApi.tts.speak(
      text,
      {
        enqueue: false,
        lang: language,
        onEvent: (event: { errorMessage?: string; type: string }) => {
          if (event.type === 'error')
            reject(new Error(event.errorMessage ?? 'Speech failed'))
          if (['cancelled', 'end', 'interrupted'].includes(event.type))
            resolve()
        },
        rate,
        voiceName: voice?.voiceName,
      },
      () => {
        const error = chromeApi.runtime.lastError
        if (error) reject(new Error(error.message))
      }
    )
  })

  return voice?.voiceName ?? voice?.lang ?? 'Chrome default voice'
}
