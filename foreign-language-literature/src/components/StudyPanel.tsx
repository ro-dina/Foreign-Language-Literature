import { useEffect, useRef, useState } from 'react'
import type { Sentence, Token } from '../models'
import { dictKey } from '../lib/reading'
import { diffBuildStep } from './BuildDiff'
import { Tabs } from './Tabs'
export type StudyTab =
  'translation' | 'structure' | 'grammar' | 'vocabulary' | 'notes'
const grammarTypes = {
  grammar: '文法',
  conjugation: '活用',
  pattern: '構文',
  idiom: '熟語'
}
function BuildSteps({ steps }: { steps: string[] }) {
  const [step, setStep] = useState(0)
  if (!steps.length)
    return <p className="empty-state">構文ステップは未登録です。</p>
  return (
    <>
      <div className="section-intro">
        <p className="eyebrow">最小構成からの積み上げ</p>
        <p className="muted">黄色は、ひとつ前のステップから加わった語です。</p>
      </div>
      <div className="step-track" aria-label="構文のステップ">
        {steps.map((_, i) => (
          <button
            key={i}
            className={i === step ? 'active' : ''}
            aria-pressed={i === step}
            onClick={() => setStep(i)}
            aria-label={`ステップ ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
      <div className="build-stage" aria-live="polite">
        <span className="eyebrow">
          STEP {String(step + 1).padStart(2, '0')} / {steps.length}
        </span>
        <p className="source">
          {step === 0 ? steps[0] : diffBuildStep(steps[step - 1], steps[step])}
        </p>
      </div>
      <div className="row-actions">
        <button disabled={step === 0} onClick={() => setStep(step - 1)}>
          ← 戻る
        </button>
        <button
          disabled={step === steps.length - 1}
          onClick={() => setStep(step + 1)}
        >
          付け加える →
        </button>
      </div>
      <details className="all-steps">
        <summary>全ステップを比較</summary>
        <ol>
          {steps.map((s, i) => (
            <li key={i}>{i === 0 ? s : diffBuildStep(steps[i - 1], s)}</li>
          ))}
        </ol>
      </details>
    </>
  )
}
export function StudyPanel(p: {
  sentence: Sentence
  language: string
  tokens: Token[]
  tab: StudyTab
  onTab: (tab: StudyTab) => void
  onClose: () => void
  english: boolean
  japanese: boolean
  toggleEnglish: () => void
  toggleJapanese: () => void
  weakSet: Set<string>
  toggleWeak: (text: string) => void
  onGrammar: (id: string) => void
  focusGrammar: string | null
  selectedToken: string | null
  onEditToken?: (token: Token) => void
}) {
  const content = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (p.tab === 'grammar' && p.focusGrammar) {
      const item = content.current?.querySelector<HTMLDetailsElement>(
        `[data-grammar="${CSS.escape(p.focusGrammar)}"]`
      )
      if (item) {
        item.open = true
        item.focus()
      }
    }
    if (p.tab === 'vocabulary' && p.selectedToken) {
      const card = content.current?.querySelector<HTMLDetailsElement>(
        `[data-vocab="${CSS.escape(p.selectedToken)}"]`
      )
      if (card) {
        card.open = true
        card.focus()
      }
    }
  }, [p.tab, p.focusGrammar, p.selectedToken, p.sentence.id])
  const tokens = Array.from(new Map(p.tokens.map((t) => [t.text, t])).values())
  return (
    <>
      <div className="panel-heading">
        <div>
          <p className="eyebrow">READING COMPANION</p>
          <h2>ことばの手引き</h2>
        </div>
        <button className="quiet" onClick={p.onClose} aria-label="解説を閉じる">
          閉じる
        </button>
      </div>
      <p className="panel-source">{p.sentence.source}</p>
      <Tabs
        label="学習情報"
        value={p.tab}
        onChange={p.onTab}
        tabs={[
          { id: 'translation', label: '翻訳' },
          { id: 'structure', label: '構文' },
          { id: 'grammar', label: '文法', count: p.sentence.grammar.length },
          { id: 'vocabulary', label: '語彙', count: tokens.length },
          { id: 'notes', label: '備考' }
        ]}
      />
      <div
        className="study-content"
        ref={content}
        role="tabpanel"
        aria-label={
          {
            translation: '翻訳',
            structure: '構文',
            grammar: '文法',
            vocabulary: '語彙',
            notes: '備考'
          }[p.tab]
        }
      >
        {p.tab === 'translation' && (
          <>
            <div className="row-actions translation-switch">
              <button aria-pressed={p.english} onClick={p.toggleEnglish}>
                英語 {p.english ? 'ON' : 'OFF'}
              </button>
              <button aria-pressed={p.japanese} onClick={p.toggleJapanese}>
                日本語 {p.japanese ? 'ON' : 'OFF'}
              </button>
            </div>
            {p.english && (
              <section className="translation-block">
                <h3>ENGLISH</h3>
                <p lang="en">{p.sentence.english || '英語訳は未登録です。'}</p>
              </section>
            )}
            {p.japanese && (
              <section className="translation-block">
                <h3>日本語訳</h3>
                <p>{p.sentence.japanese || '日本語訳は未登録です。'}</p>
              </section>
            )}
            {!p.english && !p.japanese && (
              <p className="empty-state">表示する翻訳を選択してください。</p>
            )}
          </>
        )}
        {p.tab === 'structure' && (
          <BuildSteps key={p.sentence.id} steps={p.sentence.buildUp} />
        )}
        {p.tab === 'grammar' && (
          <>
            <p className="muted">
              見出しを開くと、詳細と活用表を確認できます。
            </p>
            {!p.sentence.grammar.length && (
              <p className="empty-state">この文の文法事項は未登録です。</p>
            )}
            {p.sentence.grammar.map((g) => (
              <details
                key={g.id}
                className="grammar-entry"
                data-grammar={g.id}
                tabIndex={-1}
              >
                <summary>
                  <span className="type-label">
                    {grammarTypes[g.type || 'grammar']}
                  </span>
                  <strong>{g.title}</strong>
                  <span className="grammar-preview">
                    {g.body.slice(0, 65)}
                    {g.body.length > 65 ? '…' : ''}
                  </span>
                </summary>
                <div className="grammar-body">
                  <p className="target-words">
                    対象語句:{' '}
                    {p.tokens
                      .filter((t) => t.grammarRefs?.includes(g.id))
                      .map((t) => t.text)
                      .join(' · ') || '文全体'}
                  </p>
                  <p>{g.body}</p>
                  {!!g.tags?.length && (
                    <p className="muted">{g.tags.join(' / ')}</p>
                  )}
                  {!!g.tableRows?.length && (
                    <div className="table-scroll">
                      <table>
                        <tbody>
                          {g.tableRows.map((row, i) => (
                            <tr key={i}>
                              {row.map((cell, j) =>
                                i === 0 ? (
                                  <th key={j} scope="col">
                                    {cell}
                                  </th>
                                ) : (
                                  <td key={j}>{cell}</td>
                                )
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  <small className="muted">{g.id}</small>
                </div>
              </details>
            ))}
          </>
        )}
        {p.tab === 'vocabulary' && (
          <>
            <p className="muted">
              語句を開くと、語源・性・文法参照を確認できます。
            </p>
            {tokens.map((t) => {
              const weak = p.weakSet.has(dictKey(p.language, t.text))
              return (
                <details
                  className="vocab-entry"
                  key={t.text}
                  data-vocab={t.text}
                  tabIndex={-1}
                >
                  <summary>
                    <strong>{t.text}</strong>
                    <span>{t.ja || t.en || '意味は未登録'}</span>
                    {weak && <small className="weak-label">苦手</small>}
                  </summary>
                  <div className="vocab-body">
                    <dl>
                      <dt>English</dt>
                      <dd>{t.en || '未登録'}</dd>
                      {t.lemma && (
                        <>
                          <dt>辞書形</dt>
                          <dd>{t.lemma}</dd>
                        </>
                      )}
                      {t.partOfSpeech && (
                        <>
                          <dt>品詞</dt>
                          <dd>{t.partOfSpeech}</dd>
                        </>
                      )}
                      <dt>日本語</dt>
                      <dd>{t.ja || '未登録'}</dd>
                      <dt>性</dt>
                      <dd>
                        {(
                          {
                            m: '男性 (m)',
                            f: '女性 (f)',
                            n: '中性 (n)'
                          } as Record<string, string>
                        )[t.gender || ''] || '指定なし'}
                      </dd>
                      <dt>語源・メモ</dt>
                      <dd>{t.origin || '未登録'}</dd>
                      <dt>文法参照</dt>
                      <dd>
                        {t.grammarRefs?.length
                          ? t.grammarRefs.map((ref) => (
                              <button
                                className="text-button"
                                key={ref}
                                onClick={() => p.onGrammar(ref)}
                              >
                                {ref}
                              </button>
                            ))
                          : 'なし'}
                      </dd>
                    </dl>
                    <div className="row-actions">
                      <button
                        className={weak ? 'weak-toggle active' : 'weak-toggle'}
                        aria-pressed={weak}
                        onClick={() => p.toggleWeak(t.text)}
                      >
                        {weak ? '苦手を解除' : '苦手に登録'}
                      </button>
                      {p.onEditToken && (
                        <button onClick={() => p.onEditToken?.(t)}>
                          辞書で編集
                        </button>
                      )}
                    </div>
                  </div>
                </details>
              )
            })}
            {!tokens.length && (
              <p className="empty-state">単語は未登録です。</p>
            )}
          </>
        )}
        {p.tab === 'notes' &&
          (p.sentence.notes.length ? (
            <ul className="notes-list">
              {p.sentence.notes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ul>
          ) : (
            <p className="empty-state">備考は未登録です。</p>
          ))}
      </div>
    </>
  )
}
