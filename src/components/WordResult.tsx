import type { WordData } from '../api'
import { playAudio } from '../audio'

interface Props {
  data: WordData
}

export default function WordResult({ data }: Props) {
  const syllables = data.words.length > 0 ? data.words : [data.word]

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
        <button
          onClick={() => playAudio(data.word)}
          aria-label="朗读单词"
          className="mt-2 shrink-0 rounded-full border border-ink/15 p-3 text-ink-soft transition-colors hover:border-accent hover:text-accent"
        >
          <SpeakerIcon />
        </button>
      </header>

      {/* full phonetic */}
      <p className="mt-5 font-cn text-2xl tracking-wide text-ink-soft">{data.phonetic}</p>

      {/* per-syllable cards: tapping a card plays that syllable's phonetic */}
      {data.phonetics.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-3">
          {syllables.map((s, i) => {
            const ph = data.phonetics[i]
            return (
              <button
                key={i}
                onClick={() => ph && playAudio(ph)}
                disabled={!ph}
                aria-label={ph ? `朗读 ${ph}` : s}
                className="group rounded-md bg-paper-deep/70 px-4 py-2 text-center transition-colors hover:bg-paper-deep disabled:cursor-default"
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
