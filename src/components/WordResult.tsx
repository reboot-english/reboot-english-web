import { useEffect, useState } from 'react'
import type { WordData } from '../api'
import { deleteAudio, deleteWord, favoriteWord, isFavorite, lookupWord, unfavoriteWord } from '../api'
import { playAudio } from '../audio'

interface Props {
  data: WordData
  /** 更新成功后把重新查询到的数据回传给父组件刷新显示 */
  onUpdated?: (fresh: WordData) => void
}

/** 拆分建议的一组：单词块 text + 音标块 iphonetic */
interface SplitPair {
  text: string
  iphonetic: string
}

export default function WordResult({ data, onUpdated }: Props) {
  const syllables = data.words.length > 0 ? data.words : [data.word]

  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [refreshingFull, setRefreshingFull] = useState(false)
  const [refreshingIdx, setRefreshingIdx] = useState<number | null>(null)
  const [hintOpen, setHintOpen] = useState(false)
  // 拆分建议：多组「单词块 text + 音标块 iphonetic」
  const [pairs, setPairs] = useState<SplitPair[]>([{ text: '', iphonetic: '' }])

  useEffect(() => {
    let active = true
    setFavorited(false)
    isFavorite(data.word)
      .then((v) => {
        if (active) setFavorited(v)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [data.word])

  async function toggleFavorite() {
    if (favLoading) return
    const next = !favorited
    setFavLoading(true)
    setFavorited(next) // optimistic
    try {
      if (next) await favoriteWord(data.word)
      else await unfavoriteWord(data.word)
    } catch {
      setFavorited(!next) // revert on failure
    } finally {
      setFavLoading(false)
    }
  }

  // 复制单词到剪贴板
  async function copy() {
    try {
      await navigator.clipboard.writeText(data.word)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // 复制失败，保持原状态
    }
  }

  // 更新整词音标发音：删音频缓存后重新播放（重新合成）
  async function refreshFullAudio() {
    if (refreshingFull) return
    setRefreshingFull(true)
    try {
      await deleteAudio(data.phonetic)
      await playAudio(data.phonetic)
    } catch {
      // 失败则忽略
    } finally {
      setRefreshingFull(false)
    }
  }

  // 更新单个音标块发音：删音频缓存后重新播放（重新合成）
  async function refreshPhonetic(idx: number, ph: string) {
    if (refreshingIdx !== null) return
    setRefreshingIdx(idx)
    try {
      await deleteAudio(ph)
      await playAudio(ph)
    } catch {
      // 失败则忽略
    } finally {
      setRefreshingIdx(null)
    }
  }

  // 复制单个音标片段到剪贴板
  async function copyPhonetic(idx: number, ph: string) {
    try {
      await navigator.clipboard.writeText(ph)
      setCopiedIdx(idx)
      setTimeout(() => setCopiedIdx((cur) => (cur === idx ? null : cur)), 1500)
    } catch {
      // 复制失败，保持原状态
    }
  }

  // 打开更新弹窗，用当前已拆分的单词块/音标块预填
  function openHint() {
    const preset = syllables.map((s, i) => ({ text: s, iphonetic: data.phonetics[i] ?? '' }))
    setPairs(preset.length > 0 ? preset : [{ text: '', iphonetic: '' }])
    setHintOpen(true)
  }

  function updatePair(idx: number, key: keyof SplitPair, val: string) {
    setPairs((prev) => prev.map((p, i) => (i === idx ? { ...p, [key]: val } : p)))
  }

  function addPair() {
    setPairs((prev) => [...prev, { text: '', iphonetic: '' }])
  }

  // 批量删除：清空所有单词块/音标块，重置为一行空白
  function clearPairs() {
    setPairs([{ text: '', iphonetic: '' }])
  }

  function removePair(idx: number) {
    setPairs((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  }

  // 与相邻行交换位置：dir = -1 上移，+1 下移
  function movePair(idx: number, dir: -1 | 1) {
    setPairs((prev) => {
      const target = idx + dir
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // 提交更新：把非空键值对拼成 JSON 数组字符串作为 splitHint（全空则传空字符串）
  async function submitHint() {
    setHintOpen(false)
    const filled = pairs
      .map((p) => ({ text: p.text.trim(), iphonetic: p.iphonetic.trim() }))
      .filter((p) => p.text !== '' || p.iphonetic !== '')
    const hint = filled.length > 0 ? JSON.stringify(filled) : ''
    await update(hint)
  }

  // 更新：1) 删单词查词缓存 2) 删音频（整词 + 整词音标 + 各音节音标块）3) 携带建议重新查询刷新
  async function update(hint = '') {
    if (updating) return
    setUpdating(true)
    try {
      // 第一步：删除单词数据
      await deleteWord(data.word)

      // 第二步：删除音频——整词、整词音标、各音节音标块，去重并过滤空值
      const audioKeys = Array.from(
        new Set([data.word, data.phonetic, ...data.phonetics].filter(Boolean)),
      )
      await Promise.all(audioKeys.map((key) => deleteAudio(key)))

      // 第三步：携带建议重新查询单词，回传父组件刷新显示
      const fresh = await lookupWord(data.word, hint)
      onUpdated?.(fresh)
    } catch {
      // 更新失败，保持原数据不变
    } finally {
      setUpdating(false)
    }
  }

  return (
    <article className="animate-[fadein_0.5s_ease]">
      {/* headline: word split into syllables */}
      <header className="flex items-start justify-between gap-6">
        <h1 className="flex flex-wrap items-baseline font-serif text-6xl font-medium leading-none text-ink sm:text-7xl">
          {syllables.map((s, i) => (
            <span key={i} className="flex items-baseline">
              {i > 0 && <span className="mx-2 text-2xl text-ink-faint sm:mx-3">·</span>}
              <span>{s}</span>
            </span>
          ))}
        </h1>
        <div className="mt-2 flex shrink-0 items-center gap-3">
          <button
            onClick={() => playAudio(data.phonetic)}
            aria-label="朗读单词"
            className="rounded-full border border-ink/15 p-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
          >
            <SpeakerIcon />
          </button>
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            aria-label={favorited ? '取消收藏' : '收藏'}
            aria-pressed={favorited}
            className={`rounded-full border p-3 transition-colors disabled:opacity-50 ${
              favorited
                ? 'border-accent text-accent'
                : 'border-ink/15 text-ink-soft hover:border-accent hover:text-accent'
            }`}
          >
            <StarIcon filled={favorited} />
          </button>
          <button
            onClick={openHint}
            disabled={updating}
            aria-label="更新"
            title="删除缓存与音频后重新查询"
            className="rounded-full border border-ink/15 p-3 text-ink-soft transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          >
            <RefreshIcon spinning={updating} />
          </button>
          <button
            onClick={copy}
            aria-label="复制单词"
            title={copied ? '已复制' : '复制单词'}
            className={`rounded-full border p-3 transition-colors ${
              copied
                ? 'border-accent text-accent'
                : 'border-ink/15 text-ink-soft hover:border-accent hover:text-accent'
            }`}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </header>

      {/* full phonetic — hover 浮现刷新发音按钮 */}
      <div className="group mt-5 inline-flex items-center gap-2">
        <p className="font-cn text-2xl tracking-wide text-ink-soft">{data.phonetic}</p>
        <button
          onClick={refreshFullAudio}
          disabled={refreshingFull}
          aria-label="更新发音"
          title="删除音频后重新合成发音"
          className={`rounded-full p-1 text-ink-faint transition-opacity hover:text-accent ${
            refreshingFull ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <RefreshIcon spinning={refreshingFull} size={16} />
        </button>
      </div>

      {/* per-syllable cards: tapping a card plays that syllable's phonetic */}
      {data.phonetics.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {syllables.map((s, i) => {
            const ph = data.phonetics[i]
            return (
              <div
                key={i}
                className="group relative rounded-md bg-paper-deep/70 transition-colors hover:bg-paper-deep"
              >
                <button
                  onClick={() => ph && playAudio(ph)}
                  disabled={!ph}
                  aria-label={ph ? `朗读 ${ph}` : s}
                  className="block w-full px-5 pb-2 pt-5 text-center disabled:cursor-default"
                >
                  <div className="font-serif text-xl text-ink transition-colors group-hover:text-accent">
                    {s}
                  </div>
                  {ph && (
                    <div className="mt-0.5 font-cn text-sm text-ink-faint transition-colors group-hover:text-accent">
                      {ph}
                    </div>
                  )}
                </button>
                {ph && (
                  <button
                    onClick={() => refreshPhonetic(i, ph)}
                    disabled={refreshingIdx !== null}
                    aria-label={`更新发音 ${ph}`}
                    title="删除音频后重新合成发音"
                    className={`absolute left-1.5 top-1.5 rounded-full p-1 transition-opacity ${
                      refreshingIdx === i
                        ? 'text-accent opacity-100'
                        : 'text-ink-faint opacity-0 hover:text-accent group-hover:opacity-100'
                    }`}
                  >
                    <RefreshIcon spinning={refreshingIdx === i} size={14} />
                  </button>
                )}
                {ph && (
                  <button
                    onClick={() => copyPhonetic(i, ph)}
                    aria-label={`复制音标 ${ph}`}
                    title={copiedIdx === i ? '已复制' : '复制音标'}
                    className={`absolute right-1.5 top-1.5 rounded-full p-1 transition-opacity ${
                      copiedIdx === i
                        ? 'text-accent opacity-100'
                        : 'text-ink-faint opacity-0 hover:text-accent group-hover:opacity-100'
                    }`}
                  >
                    {copiedIdx === i ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      <hr className="my-9 border-0 border-t border-ink/10" />

      {/* definitions grouped by part of speech */}
      <div className="space-y-9">
        {data.poss.map((p, i) => (
          <section key={i}>
            <div className="mb-4 flex items-baseline gap-3">
              <span className="font-serif text-lg italic uppercase tracking-widest text-accent">
                {p.pos}.
              </span>
              <span className="font-cn text-base text-ink-soft">{p.name}</span>
            </div>
            <ol className="space-y-3">
              {p.meanings.map((m, j) => (
                <li key={j} className="flex items-baseline gap-4">
                  <span className="w-5 shrink-0 text-right font-serif text-sm text-ink-faint">
                    {j + 1}
                  </span>
                  <span className="font-cn text-xl text-ink">{m}</span>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* 更新弹窗：可选填写拆分建议 splitHint */}
      {hintOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 p-4 animate-[fadein_0.2s_ease]"
          onClick={() => setHintOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg bg-paper p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-serif text-2xl font-medium text-ink">更新「{data.word}」</h2>
            <p className="mt-2 font-cn text-sm text-ink-soft">
              可填写拆分建议（单词块 + 音标块），留空则按默认方式重新生成。
            </p>

            <div className="mt-4 space-y-2">
              {/* 表头 */}
              <div className="flex gap-2 px-1 font-cn text-xs text-ink-faint">
                <span className="flex-1">单词块</span>
                <span className="flex-1">音标块</span>
                <span className="w-[5.25rem]" />
              </div>
              {pairs.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={p.text}
                    onChange={(e) => updatePair(i, 'text', e.target.value)}
                    autoFocus={i === 0}
                    placeholder="mu"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-md border border-ink/15 bg-paper-deep/40 px-3 py-2 font-cn text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <input
                    value={p.iphonetic}
                    onChange={(e) => updatePair(i, 'iphonetic', e.target.value)}
                    placeholder="/ˈmʌ/"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 rounded-md border border-ink/15 bg-paper-deep/40 px-3 py-2 font-cn text-base text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => movePair(i, -1)}
                    disabled={i === 0}
                    aria-label="上移该行"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink-faint"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m18 15-6-6-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => movePair(i, 1)}
                    disabled={i === pairs.length - 1}
                    aria-label="下移该行"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink-faint"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => removePair(i)}
                    disabled={pairs.length === 1}
                    aria-label="删除该行"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-faint transition-colors hover:text-accent disabled:opacity-30 disabled:hover:text-ink-faint"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <button
                type="button"
                onClick={addPair}
                className="flex items-center gap-1.5 font-cn text-sm text-ink-soft transition-colors hover:text-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                添加一行
              </button>
              <button
                type="button"
                onClick={clearPairs}
                className="flex items-center gap-1.5 font-cn text-sm text-ink-faint transition-colors hover:text-accent"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                清空
              </button>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setHintOpen(false)}
                className="rounded-md px-4 py-2 font-cn text-sm text-ink-soft transition-colors hover:text-ink"
              >
                取消
              </button>
              <button
                onClick={submitHint}
                className="rounded-md bg-accent px-5 py-2 font-cn text-sm text-paper transition-opacity hover:opacity-90"
              >
                更新
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )
}

function SpeakerIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5 6 9H2v6h4l5 4V5Z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  )
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 2.7 5.46 6.03.88-4.36 4.25 1.03 6L12 16.9 6.6 19.6l1.03-6L3.27 9.34l6.03-.88L12 3Z" />
    </svg>
  )
}

function RefreshIcon({ spinning, size = 22 }: { spinning: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'animate-spin' : ''}>
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  )
}

function CopyIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CheckIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
