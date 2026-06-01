import { useEffect, useRef, useState } from 'react'
import { suggestWords } from '../api'

interface Props {
  initial?: string
  onSearch: (word: string) => void
  loading?: boolean
  autoFocus?: boolean
}

export default function SearchBar({ initial = '', onSearch, loading, autoFocus }: Props) {
  const [value, setValue] = useState(initial)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1) // 键盘高亮的候选下标，-1 表示未选中
  const inputRef = useRef<HTMLInputElement>(null)
  const latestSuggest = useRef(0)
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const lastFired = useRef('') // 上次已查询的词；输入等于它时不再弹出下拉

  useEffect(() => {
    // 外部设置查询词（如点击示例词）时同步输入框，并视为"已查询"，避免随后弹出下拉
    lastFired.current = initial.trim()
    setValue(initial)
  }, [initial])

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus()
  }, [autoFocus])

  // 输入变化后，防抖检索单词库前缀；仅在含字母时触发
  useEffect(() => {
    const prefix = value.trim()
    // 输入与刚查询的词相同（点击候选/回车后）时，不再弹出下拉
    if (prefix === lastFired.current) {
      setSuggestions([])
      setOpen(false)
      return
    }
    if (!/[a-zA-Z]/.test(prefix)) {
      setSuggestions([])
      setOpen(false)
      return
    }
    clearTimeout(debounceTimer.current)
    debounceTimer.current = setTimeout(() => {
      const requestId = ++latestSuggest.current
      suggestWords(prefix, 10)
        .then((list) => {
          if (requestId !== latestSuggest.current) return
          setSuggestions(list)
          setActive(-1)
          setOpen(list.length > 0)
        })
        .catch(() => {})
    }, 200)
    return () => clearTimeout(debounceTimer.current)
  }, [value])

  function fire(word: string) {
    const w = word.trim()
    if (!w) return
    // 作废任何在途/待发的检索，避免其返回后又把下拉重新打开
    clearTimeout(debounceTimer.current)
    latestSuggest.current++
    lastFired.current = w // 记录已查询的词，避免随后又弹出下拉
    setOpen(false)
    setSuggestions([])
    onSearch(w)
  }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    // 若有高亮候选则选它，否则用当前输入
    if (open && active >= 0 && active < suggestions.length) {
      setValue(suggestions[active])
      fire(suggestions[active])
    } else {
      fire(value)
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      <form onSubmit={submit} className="group flex items-end gap-6 border-b border-ink/40 pb-3">
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          placeholder="输入英语单词…"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
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

      {/* 前缀候选下拉 */}
      {open && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-md border border-ink/10 bg-paper shadow-lg animate-[fadein_0.15s_ease]">
          {suggestions.map((w, i) => (
            <li key={w}>
              <button
                type="button"
                // 用 mousedown 抢在 input 的 blur 之前触发，避免下拉先被关闭
                onMouseDown={(e) => {
                  e.preventDefault()
                  setValue(w)
                  fire(w)
                }}
                onMouseEnter={() => setActive(i)}
                className={`block w-full px-5 py-2.5 text-left font-cn text-lg transition-colors ${
                  i === active ? 'bg-paper-deep text-accent' : 'text-ink hover:bg-paper-deep/60'
                }`}
              >
                {w}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
