import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { isFound, lookupWord, type WordData } from '../api'
import WordResult from './WordResult'

type DetailStatus = 'idle' | 'loading' | 'done' | 'error'

interface Props {
  /** 页面标题，例如「我的收藏」「单词库」 */
  title: string
  /** 拉取单词列表的接口函数 */
  fetchWords: () => Promise<string[]>
  /** 列表为空时的提示文案 */
  emptyText: string
}

export default function WordListView({ title, fetchWords, emptyText }: Props) {
  const [words, setWords] = useState<string[]>([])
  const [listStatus, setListStatus] = useState<'loading' | 'done' | 'error'>('loading')

  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<WordData | null>(null)
  const [detailStatus, setDetailStatus] = useState<DetailStatus>('idle')
  const [detailError, setDetailError] = useState('')
  const latestRequest = useRef(0)

  useEffect(() => {
    let active = true
    fetchWords()
      .then((list) => {
        if (!active) return
        setWords(list)
        setListStatus('done')
      })
      .catch(() => {
        if (active) setListStatus('error')
      })
    return () => {
      active = false
    }
  }, [fetchWords])

  async function selectWord(word: string) {
    if (word === selected) return
    const requestId = ++latestRequest.current
    setSelected(word)
    setDetailStatus('loading')
    setDetailError('')
    try {
      const result = await lookupWord(word)
      if (requestId !== latestRequest.current) return
      setDetail(result)
      setDetailStatus('done')
    } catch (e) {
      if (requestId !== latestRequest.current) return
      setDetailError(e instanceof Error ? e.message : '查询失败')
      setDetailStatus('error')
    }
  }

  return (
    <div className="flex h-screen flex-col px-6 py-10 sm:px-10">
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {/* header */}
        <header className="mb-8 flex shrink-0 items-baseline justify-between">
          <h1 className="font-serif text-2xl text-ink">{title}</h1>
          <Link
            to="/"
            className="font-cn text-sm text-ink-soft transition-colors hover:text-accent"
          >
            ← 返回查询
          </Link>
        </header>

        {/* two independently-scrolling panes (master-detail) */}
        <div className="flex min-h-0 flex-1 gap-8">
          {/* left: word list */}
          <aside className="scrollbar-subtle w-52 shrink-0 overflow-y-auto pr-2 sm:w-72">
            {listStatus === 'loading' && (
              <p className="font-cn text-sm text-ink-faint">加载中…</p>
            )}
            {listStatus === 'error' && (
              <p className="font-cn text-sm text-ink-soft">加载失败，请稍后再试。</p>
            )}
            {listStatus === 'done' && words.length === 0 && (
              <p className="font-cn text-sm text-ink-faint">{emptyText}</p>
            )}
            {listStatus === 'done' && words.length > 0 && (
              <ul className="space-y-2">
                {words.map((w) => (
                  <li key={w}>
                    <button
                      onClick={() => selectWord(w)}
                      className={`w-full truncate rounded-lg px-4 py-3 text-left font-serif text-2xl leading-snug tracking-wide transition-colors sm:text-3xl ${
                        w === selected
                          ? 'bg-paper-deep text-accent'
                          : 'text-ink hover:bg-paper-deep/60 hover:text-accent'
                      }`}
                    >
                      {w}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {/* right: detail panel */}
          <section className="scrollbar-subtle min-w-0 flex-1 overflow-y-auto border-l border-ink/10 pl-8">
            {detailStatus === 'idle' && (
              <p className="mt-10 font-cn text-ink-faint">从左侧选择一个单词查看详情。</p>
            )}
            {detailStatus === 'loading' && (
              <p className="mt-10 font-cn text-ink-faint">查询中…</p>
            )}
            {detailStatus === 'error' && (
              <div className="mt-10 font-cn text-ink-soft">
                <p className="text-lg">出错了</p>
                <p className="mt-1 text-sm text-ink-faint">{detailError}</p>
              </div>
            )}
            {detailStatus === 'done' && detail && (
              <div key={detail.word}>
                {isFound(detail) ? (
                  <WordResult data={detail} />
                ) : (
                  <p className="mt-10 font-cn text-ink-soft">没有找到「{detail.word}」的释义。</p>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
