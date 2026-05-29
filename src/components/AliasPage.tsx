import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteAlias, listAlias, type Alias } from '../api'

export default function AliasPage() {
  const [aliases, setAliases] = useState<Alias[]>([])
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')
  const [busy, setBusy] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    listAlias()
      .then((list) => {
        if (!active) return
        setAliases(list)
        setStatus('done')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  // 删除：调删除接口（参数是别名 raw），成功后从列表移除该条。
  async function remove(raw: string) {
    if (busy) return
    setBusy(raw)
    try {
      await deleteAlias(raw)
      setAliases((list) => list.filter((a) => a.raw !== raw))
    } catch {
      // 删除失败则保留条目
    } finally {
      setBusy((cur) => (cur === raw ? null : cur))
    }
  }

  return (
    <div className="flex h-screen flex-col px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {/* header */}
        <header className="mb-8 flex shrink-0 items-baseline justify-between">
          <h1 className="font-serif text-2xl text-ink">别名库</h1>
          <Link
            to="/"
            className="font-cn text-sm text-ink-soft transition-colors hover:text-accent"
          >
            ← 返回查询
          </Link>
        </header>

        {/* scrollable grid of alias mappings */}
        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto">
          {status === 'loading' && (
            <p className="font-cn text-sm text-ink-faint">加载中…</p>
          )}
          {status === 'error' && (
            <p className="font-cn text-sm text-ink-soft">加载失败，请稍后再试。</p>
          )}
          {status === 'done' && aliases.length === 0 && (
            <p className="font-cn text-sm text-ink-faint">还没有别名映射。</p>
          )}
          {status === 'done' && aliases.length > 0 && (
            <ul className="grid grid-cols-1 gap-3 pb-4 sm:grid-cols-2 lg:grid-cols-3">
              {aliases.map((a) => {
                const isBusy = busy === a.raw
                return (
                  <li key={a.raw}>
                    <div className="flex items-center gap-3 rounded-lg border border-ink/10 px-4 py-3 transition-colors hover:border-accent/50 hover:bg-paper-deep/60">
                      {/* alias → real word */}
                      <div className="flex min-w-0 flex-1 items-baseline gap-2">
                        <span className="min-w-0 truncate font-serif text-xl text-ink">
                          {a.raw}
                        </span>
                        <span className="shrink-0 text-ink-faint" aria-hidden>
                          →
                        </span>
                        <span className="min-w-0 truncate font-serif text-base text-ink-soft">
                          {a.word}
                        </span>
                      </div>

                      {/* delete */}
                      <button
                        onClick={() => remove(a.raw)}
                        disabled={isBusy}
                        aria-label={`删除别名 ${a.raw}`}
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
