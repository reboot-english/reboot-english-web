export function audioUrl(text: string): string {
  return `/api/word/getAudio?word=${encodeURIComponent(text)}`
}

let current: HTMLAudioElement | null = null

export function playAudio(text: string): Promise<void> {
  if (current) {
    current.pause()
    current = null
  }
  const audio = new Audio(audioUrl(text))
  current = audio
  return audio.play().catch(() => {
    /* autoplay/load failures are non-fatal */
  })
}
