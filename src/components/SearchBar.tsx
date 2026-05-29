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
        className="shrink-0 pb-1 font-cn text-lg text-ink-soft transition-colors hover:text-accent disabled:opacity-40"
      >
        {loading ? '查询中' : '查询'}
      </button>
    </form>
  )
}
