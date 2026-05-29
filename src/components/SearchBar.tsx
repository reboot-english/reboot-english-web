import { useEffect, useRef, useState } from 'react'

interface Props {
  initial?: string
  onSearch: (word: string) => void
  loading?: boolean
  autoFocus?: boolean
}

export default function SearchBar({ initial = '', onSearch, loading, autoFocus }: Props) {
  const [value, setValue] = useState(initial)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue(initial)
  }, [initial])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const w = value.trim()
    if (w) onSearch(w)
  }

  return (
    <form onSubmit={submit} className="group flex items-end gap-6 border-b border-ink/40 pb-3">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="输入英语单词…"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        className="min-w-0 flex-1 bg-transparent py-1 font-cn text-3xl !leading-normal tracking-wide text-ink placeholder:text-ink-faint focus:outline-none sm:text-4xl"
      />
      <button
        type="submit"
        disabled={loading}
        aria-label={loading ? '查询中' : '查询'}
        className="shrink-0 pb-1 text-ink-soft transition-colors hover:text-accent disabled:opacity-60"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={loading ? 'search-pulse' : ''}
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </form>
  )
}
