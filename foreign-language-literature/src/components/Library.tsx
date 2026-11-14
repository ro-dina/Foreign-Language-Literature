import type { Sentence, Work } from '../models'

type Props = {
  data: Work[]
  work: Work
  sectionId: string
  sentenceId: string
  readSet: Set<string>
  query: string
  onQuery: (query: string) => void
  hits: { w: Work; s: Work['sections'][number]; x: Sentence }[]
  onSelect: (work: string, section: string, sentence: string) => void
  onClose: () => void
  onExport: () => void
  onImport: (file: File) => void
  onManage?: () => void
  onCloud?: () => void
}
export function Library(p: Props) {
  const section =
    p.work.sections.find((s) => s.id === p.sectionId) || p.work.sections[0]
  const read =
    section?.sentences.filter((x) =>
      p.readSet.has(`${p.work.id}::${section.id}::${x.id}`)
    ).length || 0
  return (
    <>
      <div className="panel-heading">
        <h2>ライブラリ</h2>
        <button
          className="quiet"
          onClick={p.onClose}
          aria-label="ライブラリを閉じる"
        >
          閉じる
        </button>
      </div>
      {(p.onManage || p.onCloud) && (
        <div className="library-management row-actions">
          {p.onManage && <button onClick={p.onManage}>作品・章を管理</button>}
          {p.onCloud && <button onClick={p.onCloud}>保存と共有</button>}
        </div>
      )}
      <label className="search-field">
        <span className="sr-only">作品横断検索</span>
        <input
          type="search"
          value={p.query}
          onChange={(e) => p.onQuery(e.target.value)}
          placeholder="本文・翻訳・備考を検索"
        />
      </label>
      {p.query.trim() && (
        <section className="search-results" aria-label="検索結果">
          <p className="eyebrow">検索結果 · {p.hits.length}件</p>
          {p.hits.slice(0, 120).map((h) => (
            <button
              key={`${h.w.id}/${h.s.id}/${h.x.id}`}
              className="search-hit"
              onClick={() => p.onSelect(h.w.id, h.s.id, h.x.id)}
            >
              <small>
                {h.w.title} / {h.s.title}
              </small>
              {h.x.label}
            </button>
          ))}
          {!p.hits.length && <p className="muted">一致する文がありません。</p>}
        </section>
      )}
      <details open className="library-section">
        <summary>
          作品 <span>{p.data.length}</span>
        </summary>
        <div className="work-list">
          {p.data.map((w, i) => {
            const total = w.sections.reduce(
              (sum, s) => sum + s.sentences.length,
              0
            )
            const count = w.sections.reduce(
              (sum, s) =>
                sum +
                s.sentences.filter((x) =>
                  p.readSet.has(`${w.id}::${s.id}::${x.id}`)
                ).length,
              0
            )
            return (
              <button
                key={w.id}
                className={`work-card ${w.id === p.work.id ? 'active' : ''}`}
                aria-pressed={w.id === p.work.id}
                onClick={() => {
                  if (w.id !== p.work.id)
                    p.onSelect(
                      w.id,
                      w.sections[0]?.id || '',
                      w.sections[0]?.sentences[0]?.id || ''
                    )
                }}
              >
                <span className="book-spine" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="work-card-copy">
                  <strong>{w.title}</strong>
                  <small>
                    {w.sourceLanguage} · {w.sections.length}章
                  </small>
                  <span className="work-progress">
                    <progress
                      value={count}
                      max={Math.max(total, 1)}
                      aria-label={`${w.title}の既読率`}
                    />
                    <small>
                      {count}/{total}
                    </small>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      </details>
      <details open className="library-section">
        <summary>
          目次 <span>{p.work.sections.length}章</span>
        </summary>
        <nav aria-label="章一覧">
          {p.work.sections.map((s, i) => (
            <button
              className={`chapter-link ${s.id === section?.id ? 'active' : ''}`}
              key={s.id}
              aria-current={s.id === section?.id ? 'true' : undefined}
              onClick={() =>
                p.onSelect(p.work.id, s.id, s.sentences[0]?.id || '')
              }
            >
              <small>{String(i + 1).padStart(2, '0')}</small>
              <span>{s.title}</span>
              <small>{s.sentences.length}文</small>
            </button>
          ))}
        </nav>
      </details>
      <details open className="library-section">
        <summary>
          この章の文 <span>{section?.sentences.length || 0}</span>
        </summary>
        <ol className="sentence-list">
          {section?.sentences.map((x, i) => (
            <li key={x.id}>
              <button
                aria-current={x.id === p.sentenceId ? 'true' : undefined}
                className={x.id === p.sentenceId ? 'active' : ''}
                onClick={() => p.onSelect(p.work.id, section.id, x.id)}
              >
                <small>{String(i + 1).padStart(2, '0')}</small>
                <span>{x.label}</span>
                {p.readSet.has(`${p.work.id}::${section.id}::${x.id}`) && (
                  <span className="read-marker" aria-label="既読">
                    ✓
                  </span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </details>
      <div className="library-footer">
        <p className="eyebrow">この章の進捗</p>
        <div className="progress-head">
          <span>
            {read} / {section?.sentences.length || 0} 文を既読
          </span>
          <strong>
            {Math.round(
              (read / Math.max(section?.sentences.length || 0, 1)) * 100
            )}
            %
          </strong>
        </div>
        <progress
          value={read}
          max={Math.max(section?.sentences.length || 0, 1)}
          aria-label="この章の読書進捗"
        />
        <details className="backup-menu">
          <summary>バックアップ</summary>
          <p className="muted">作品・辞書・進捗をJSONで保存・復元。</p>
          <div className="row-actions">
            <button onClick={p.onExport}>書き出し</button>
            <label className="import-btn">
              読み込み
              <input
                type="file"
                accept="application/json,.json"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) p.onImport(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
        </details>
      </div>
    </>
  )
}
