import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listAudio } from '../api'
import { playAudio } from '../audio'

// 音标片段形如 /pə/，整词则没有斜杠包裹。两者都可发音，只是排版略有区别。
function isPhonetic(text: string): boolean {
  return text.startsWith('/') && text.endsWith('/')
}

export default function PronunciationPage() {
  const [items, setItems] = useState<string[]>([])
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [playing, setPlaying] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listAudio()
      .then((list) => {
        if (!active) return
        setItems(list)
        setStatus('done')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  async function play(text: string) {
    setPlaying(text)
    try {
      await playAudio(text)
    } finally {
      setPlaying((cur) => (cur === text ? null : cur))
    }
  }

  return (
    <div className="flex h-screen flex-col px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {/* header */}
        <header className="mb-8 flex shrink-0 items-baseline justify-between">
          <h1 className="font-serif text-2xl text-ink">发音库</h1>
          <Link
            to="/"
            className="font-cn text-sm text-ink-soft transition-colors hover:text-accent"
          >
            ← 返回查询
          </Link>
        </header>

        {/* scrollable grid of playable items */}
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto">
          {status === 'loading' && (
            <p className="font-cn text-sm text-ink-faint">加载中…</p>
          )}
          {status === 'error' && (
            <p className="font-cn text-sm text-ink-soft">加载失败，请稍后再试。</p>
          )}
          {status === 'done' && items.length === 0 && (
            <p className="font-cn text-sm text-ink-faint">发音库里还没有内容。</p>
          )}
          {status === 'done' && items.length > 0 && (
            <ul className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 lg:grid-cols-4">
              {items.map((text) => {
                const phonetic = isPhonetic(text)
                const active = playing === text
                return (
                  <li key={text}>
                    <button
                      onClick={() => play(text)}
                      className={`group flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-3 text-left transition-colors ${
                        active
                          ? 'border-accent bg-paper-deep'
                          : 'border-ink/10 hover:border-accent/50 hover:bg-paper-deep/60'
                      }`}
                    >
                      <span
                        className={`min-w-0 truncate ${
                          phonetic
                            ? 'font-cn text-base text-ink-soft'
                            : 'font-serif text-xl text-ink'
                        }`}
                      >
                        {text}
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-4 w-4 shrink-0 transition-colors ${
                          active ? 'text-accent' : 'text-ink-faint group-hover:text-accent'
                        }`}
                        fill="currentColor"
                        aria-hidden
                      >
                        <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
