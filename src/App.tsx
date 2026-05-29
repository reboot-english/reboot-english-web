import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import SearchBar from './components/SearchBar'
import WordResult from './components/WordResult'
import { isFound, lookupWord, type WordData } from './api'

const SAMPLES = ['algorithm', 'serendipity', 'ephemeral', 'paradigm', 'wisdom']

type Status = 'idle' | 'loading' | 'done' | 'error'

export default function App() {
  const [status, setStatus] = useState<Status>('idle')
  const [data, setData] = useState<WordData | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const latestRequest = useRef(0)

  async function search(word: string) {
    const requestId = ++latestRequest.current
    setQuery(word)
    setStatus('loading')
    setError('')
    try {
      const result = await lookupWord(word)
      if (requestId !== latestRequest.current) return
      setData(result)
      setStatus('done')
    } catch (e) {
      if (requestId !== latestRequest.current) return
      setError(e instanceof Error ? e.message : '查询失败')
      setStatus('error')
    }
  }

  const hasResult = status === 'done' || status === 'error'

  return (
    <div className="relative min-h-screen px-6 py-10 sm:px-10">
      {/* nav entries, top-right */}
      <nav className="absolute right-6 top-6 flex items-center gap-5 font-cn text-sm text-ink-soft sm:right-10">
        <Link
          to="/words"
          className="flex items-center gap-1.5 transition-colors hover:text-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
          单词库
        </Link>
        <Link
          to="/favorites"
          className="flex items-center gap-1.5 transition-colors hover:text-accent"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="m12 3 2.7 5.46 6.03.88-4.36 4.25 1.03 6L12 16.9 6.6 19.6l1.03-6L3.27 9.34l6.03-.88L12 3Z" />
          </svg>
          收藏夹
        </Link>
      </nav>

      <div className="mx-auto w-full max-w-2xl">
        {/* tagline */}
        <p
          className={`text-center font-serif italic text-ink-faint transition-all duration-700 ${
            hasResult ? 'text-base' : 'text-xl'
          }`}
        >
          a quiet place for words
        </p>

        {/* search, vertically centered on the landing screen */}
        <div className={hasResult ? 'mt-10' : 'mt-[28vh]'}>
          <SearchBar
            initial={query}
            onSearch={search}
            loading={status === 'loading'}
            autoFocus
          />

          {!hasResult && (
            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 pl-1 font-serif italic text-ink-faint">
              <span className="not-italic text-sm">试试</span>
              {SAMPLES.map((w) => (
                <button
                  key={w}
                  onClick={() => search(w)}
                  className="transition-colors hover:text-accent"
                >
                  {w}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* result area */}
        {status === 'done' && data && (
          <div className="mt-14">
            {isFound(data) ? (
              <WordResult data={data} />
            ) : (
              <NotFound word={data.word} />
            )}
          </div>
        )}

        {status === 'error' && (
          <div className="mt-14 font-cn text-ink-soft">
            <p className="text-lg">出错了</p>
            <p className="mt-1 text-sm text-ink-faint">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function NotFound({ word }: { word: string }) {
  return (
    <div className="animate-[fadein_0.5s_ease] text-center">
      <p className="font-serif text-4xl text-ink-faint">{word}</p>
      <p className="mt-4 font-cn text-base text-ink-soft">没有找到这个词，换一个试试。</p>
    </div>
  )
}
