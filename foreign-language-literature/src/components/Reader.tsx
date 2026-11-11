import type { DictEntry, Sentence, Work } from '../models'
import { dictKey, mergeToken, sourceParts } from '../lib/reading'

type Props = {
  work: Work
  section: Work['sections'][number]
  sentence: Sentence
  mode: 'reading' | 'study'
  bookMode: boolean
  english: boolean
  japanese: boolean
  sourceOn: boolean
  comparison: boolean
  hintsOn: boolean
  genderOn: boolean
  dict: Record<string, DictEntry>
  weakSet: Set<string>
  readSet: Set<string>
  selectedToken: string | null
  onSentence: (id: string, explain?: boolean) => void
  onToken: (text: string) => void
  onMove: (offset: number) => void
  onRead: () => void
  onBook: () => void
  canPrevious: boolean
  canNext: boolean
}
export function Reader(p: Props) {
  const currentIndex = p.section.sentences.findIndex(
    (x) => x.id === p.sentence.id
  )
  const sentences =
    p.mode === 'reading' || p.bookMode ? p.section.sentences : [p.sentence]
  const read = p.readSet.has(`${p.work.id}::${p.section.id}::${p.sentence.id}`)
  return (
    <section className="reader" aria-label="読書エリア">
      <header className="reader-heading">
        <div className="reader-kicker">
          <span>
            {p.work.sourceLanguage} /{' '}
            {p.mode === 'reading' ? 'READING' : 'STUDY'}
          </span>
          <span>
            {String(currentIndex + 1).padStart(2, '0')} —{' '}
            {String(p.section.sentences.length).padStart(2, '0')}
          </span>
        </div>
        <h1>{p.work.title}</h1>
        <h2>{p.section.title}</h2>
        <details className="chapter-description">
          <summary>章の解説</summary>
          <p>{p.section.description || '章解説は未入力です。'}</p>
        </details>
      </header>
      <div className="reader-context">
        <span>
          {p.mode === 'reading'
            ? '文を選んで、ことばを深く読む。'
            : '選択した文を、ひとつずつ読み解く。'}
        </span>
        {p.mode === 'study' && (
          <button className="text-button" onClick={p.onBook}>
            {p.bookMode ? '一文に戻る' : '本ビューで章全体を読む'}
          </button>
        )}
      </div>
      <div className={`reader-text ${p.comparison ? 'compare' : ''}`}>
        {sentences.map((x) => {
          const selected = x.id === p.sentence.id
          const parts = sourceParts(
            x.source,
            x.tokens.map((t) => mergeToken(p.work.sourceLanguage, t, p.dict))
          )
          return (
            <article
              key={x.id}
              id={`sentence-${x.id}`}
              className={`reading-sentence ${selected ? 'selected' : ''}`}
              aria-label={`文 ${p.section.sentences.indexOf(x) + 1}`}
            >
              <div className="sentence-number">
                <button
                  aria-label={`文 ${p.section.sentences.indexOf(x) + 1}の解説を開く`}
                  aria-pressed={selected}
                  onClick={() => p.onSentence(x.id, true)}
                >
                  {String(p.section.sentences.indexOf(x) + 1).padStart(2, '0')}
                </button>
              </div>
              {p.sourceOn && (
                <p
                  className="source"
                  tabIndex={0}
                  aria-label={x.source}
                  onClick={() => p.onSentence(x.id, true)}
                  onKeyDown={(e) => {
                    if (
                      e.target === e.currentTarget &&
                      (e.key === 'Enter' || e.key === ' ')
                    ) {
                      e.preventDefault()
                      p.onSentence(x.id, true)
                    }
                  }}
                >
                  {parts.map((part, i) =>
                    part.token && p.hintsOn ? (
                      <button
                        key={i}
                        className={`word ${p.genderOn ? `gender-${part.token.gender || 'x'}` : ''} ${p.weakSet.has(dictKey(p.work.sourceLanguage, part.text)) ? 'weak-word' : ''} ${p.selectedToken === part.text && selected ? 'selected-word' : ''}`}
                        title={
                          [part.token.en, part.token.ja]
                            .filter(Boolean)
                            .join(' / ') || '語彙を確認'
                        }
                        onClick={(e) => {
                          e.stopPropagation()
                          p.onSentence(x.id)
                          p.onToken(part.text)
                        }}
                      >
                        {part.text}
                      </button>
                    ) : (
                      <span
                        key={i}
                        className={
                          p.genderOn && part.token
                            ? `gender-${part.token.gender || 'x'}`
                            : undefined
                        }
                      >
                        {part.text}
                      </span>
                    )
                  )}
                </p>
              )}
              {(p.english || p.japanese) && (
                <div className="inline-translations">
                  {p.english && (
                    <p lang="en">
                      <span className="translation-label">EN</span>
                      {x.english || '英語訳は未登録です。'}
                    </p>
                  )}
                  {p.japanese && (
                    <p lang="ja">
                      <span className="translation-label">JA</span>
                      {x.japanese || '日本語訳は未登録です。'}
                    </p>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </div>
      <footer className="reader-footer">
        <div className="row-actions">
          <button
            onClick={() => p.onMove(-1)}
            disabled={!p.canPrevious}
            title="前の文（← / k）"
          >
            ← 前の文
          </button>
          <span className="page-count" aria-live="polite">
            {currentIndex + 1} / {p.section.sentences.length}
          </span>
          <button
            onClick={() => p.onMove(1)}
            disabled={!p.canNext}
            title="次の文（→ / j）"
          >
            次の文 →
          </button>
        </div>
        <button
          aria-pressed={read}
          className={read ? 'read-toggle active' : 'read-toggle'}
          onClick={p.onRead}
          title="既読の切り替え（r）"
        >
          {read ? '✓ 既読' : '既読にする'}
        </button>
      </footer>
      <p className="keyboard-help">
        ← → 文を移動 <span>R 既読</span>
        <span>B 本ビュー</span>
      </p>
    </section>
  )
}
