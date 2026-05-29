import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAudio, listAudio } from '../api'
import { playAudio } from '../audio'

// 音标片段形如 /pə/，整词则没有斜杠包裹。两者都可发音，只是排版略有区别。
function isPhonetic(text: string): boolean {
  return text.startsWith('/') && text.endsWith('/')
}

export default function PronunciationPage() {
  const [items, setItems] = useState<string[]>([])
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [playing, setPlaying] = useState<string | null>(null)
  // 正在进行删除/更新操作的条目，禁用其按钮，避免重复点击。
  const [busy, setBusy] = useState<string | null>(null)

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

  // 删除：调删除接口，成功后把该条目从列表移除。
  async function remove(text: string) {
    if (busy) return
    setBusy(text)
    try {
      await deleteAudio(text)
      setItems((list) => list.filter((t) => t !== text))
    } catch {
      // 删除失败则保留条目，不改动列表。
    } finally {
      setBusy((cur) => (cur === text ? null : cur))
    }
  }

  // 更新：先删旧音频，再请求获取音频（重新生成并播放），条目仍保留在列表中。
  async function refresh(text: string) {
    if (busy) return
    setBusy(text)
    try {
      await deleteAudio(text)
      await play(text)
    } catch {
      // 忽略错误
    } finally {
      setBusy((cur) => (cur === text ? null : cur))
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
                const isBusy = busy === text
                return (
                  <li key={text}>
                    <div
                      className={`flex items-center gap-2 rounded-lg border px-4 py-3 transition-colors ${
                        active
                          ? 'border-accent bg-paper-deep'
                          : 'border-ink/10 hover:border-accent/50 hover:bg-paper-deep/60'
                      }`}
                    >
                      <span
                        className={`min-w-0 flex-1 truncate ${
                          phonetic
                            ? 'font-cn text-base text-ink-soft'
                            : 'font-serif text-xl text-ink'
                        }`}
                      >
                        {text}
                      </span>

                      {/* play */}
                      <button
                        onClick={() => play(text)}
                        disabled={isBusy}
                        aria-label="播放"
                        className={`shrink-0 rounded-full p-1.5 transition-colors hover:bg-ink/5 disabled:opacity-40 ${
                          active ? 'text-accent' : 'text-ink-faint hover:text-accent'
                        }`}
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4.03v8.06A4.5 4.5 0 0 0 16.5 12z" />
                        </svg>
                      </button>

                      {/* refresh: delete then re-fetch & play */}
                      <button
                        onClick={() => refresh(text)}
                        disabled={isBusy}
                        aria-label="更新发音"
                        title="删除旧音频并重新生成播放"
                        className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-ink/5 hover:text-accent disabled:opacity-40"
                      >
                        <svg viewBox="0 0 24 24" className={`h-4 w-4 ${isBusy ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                          <path d="M21 3v6h-6" />
                        </svg>
                      </button>

                      {/* delete */}
                      <button
                        onClick={() => remove(text)}
                        disabled={isBusy}
                        aria-label="删除发音"
                        className="shrink-0 rounded-full p-1.5 text-ink-faint transition-colors hover:bg-ink/5 hover:text-red-700 disabled:opacity-40"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                          <path d="M3 6h18" />
                          <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                        </svg>
                      </button>
                    </div>
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
