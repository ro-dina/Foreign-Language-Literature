import { useId, useState } from 'react'
import type { DictEntry, GrammarItem, Sentence, Token } from '../models'
import type { DraftSetters, EditorDraft } from '../hooks/useEditorDraft'
import { Tabs } from './Tabs'
import { EditorSource } from './EditorSource'
import { dictKey } from '../lib/reading'
export type EditorTab =
  | 'source'
  | 'translation'
  | 'structure'
  | 'vocabulary'
  | 'grammar'
  | 'notes'
  | 'new'
function Field({
  label,
  value,
  onChange,
  rows,
  hint,
  placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows?: number
  hint?: string
  placeholder?: string
}) {
  const id = useId()
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? id + '-hint' : undefined}
        />
      ) : (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-describedby={hint ? id + '-hint' : undefined}
        />
      )}
      {hint && (
        <p className="field-hint" id={id + '-hint'}>
          {hint}
        </p>
      )}
    </div>
  )
}
type Props = {
  draft: EditorDraft
  setters: DraftSetters
  sentence: Sentence
  language: string
  tab: EditorTab
  onTab: (t: EditorTab) => void
  dirty: boolean
  draftError: string
  message: string
  error: string
  canEdit: boolean
  onSave: () => void
  onAdd: () => void
  onDelete: () => void
  onPreview: () => void
  onSaveVocab: () => void
  onClearVocab: () => void
  onLoadVocab: (v: DictEntry) => void
  onDeleteVocab: (text: string) => void
  vocabEntries: DictEntry[]
  unresolved: string[]
  tokens: Token[]
  dict: Record<string, DictEntry>
  hasSentence: boolean
  onPickVocab: (text: string) => void
  weakSet: Set<string>
  onWeak: (text: string) => void
  onMove: (offset: number) => void
  canPrevious: boolean
  canNext: boolean
  onSaveGrammar: () => void
  onClearGrammar: () => void
  onLoadGrammar: (g: GrammarItem) => void
  onDeleteGrammar: (id: string) => void
}
export function EditorPage(p: Props) {
  const d = p.draft,
    s = p.setters
  const detailTab =
    p.tab === 'source' || p.tab === 'translation' ? 'vocabulary' : p.tab
  const [filter, setFilter] = useState('')
  const entries = p.vocabEntries.filter((e) =>
    [e.token, e.en, e.ja].join(' ').toLowerCase().includes(filter.toLowerCase())
  )
  const status =
    p.draftError ||
    (p.dirty ? '未反映の変更あり · 下書き自動保存済み' : '下書き自動保存済み')
  return (
    <section className="editor-page authoring-page" aria-label="教材編集">
      <header className="editor-heading">
        <div>
          <p className="eyebrow">MATERIAL EDITOR</p>
          <h1>教材を整える</h1>
          <p className="muted editor-current">{p.sentence.label}</p>
        </div>
        <button onClick={p.onPreview}>閲覧ページで確認 →</button>
      </header>
      <div
        className={`save-status ${p.draftError ? 'error' : ''}`}
        role="status"
      >
        <span className="status-dot" aria-hidden="true" />
        {status}
        <small>フォーム下書きのみ・未共有</small>
      </div>
      {p.message && (
        <p className="success-message" role="status">
          {p.message}
        </p>
      )}
      {p.error && (
        <p className="error-message" role="alert">
          {p.error}
        </p>
      )}
      <div className="authoring-grid">
        <div className="authoring-context">
          <div className="row-actions sentence-editor-nav">
            <button disabled={!p.canPrevious} onClick={() => p.onMove(-1)}>
              ← 前の文
            </button>
            <button disabled={!p.canNext} onClick={() => p.onMove(1)}>
              次の文 →
            </button>
          </div>
          <EditorSource
            source={d.editSource}
            language={p.language}
            tokens={p.tokens}
            dict={p.dict}
            selected={d.vocabToken}
            onPick={p.onPickVocab}
          />
          <details className="advanced-fields">
            <summary>見出しと単語の区切り</summary>
            <Field
              label="一覧の見出し"
              value={d.editLabel}
              onChange={s.setEditLabel}
            />
            <Field
              label="単語の区切り"
              value={d.editTokens}
              onChange={s.setEditTokens}
              hint="任意の語句を | で区切ります。登録済みの複数語表現は優先して表示します。"
            />
          </details>
          <Field
            label={`原文（${p.language}・必須）`}
            value={d.editSource}
            onChange={s.setEditSource}
            rows={4}
          />
          <div className="translation-editor">
            <Field
              label="日本語訳"
              value={d.editJapanese}
              onChange={s.setEditJapanese}
              rows={3}
              hint={d.editJapanese.trim() ? '' : '未入力です。'}
            />
            <Field
              label="英語訳"
              value={d.editEnglish}
              onChange={s.setEditEnglish}
              rows={3}
              hint={d.editEnglish.trim() ? '' : '未入力です。'}
            />
          </div>
          <div className="editor-savebar">
            <span className="muted">ブラウザの教材へ反映</span>
            <button
              className="primary"
              disabled={!p.hasSentence}
              onClick={p.onSave}
            >
              変更を保存
            </button>
          </div>
        </div>
        <div className="authoring-detail">
          <div className="authoring-detail-heading">
            <p className="mobile-authoring-reference" aria-label="参照用原文">
              {d.editSource}
            </p>
            <Tabs
              label="詳細編集"
              value={detailTab}
              onChange={p.onTab}
              tabs={[
                { id: 'vocabulary', label: '語彙' },
                { id: 'grammar', label: '文法' },
                { id: 'structure', label: '構文' },
                { id: 'notes', label: '備考' },
                { id: 'new', label: '＋ 新規文' }
              ]}
            />
          </div>
          <div
            className="editor-content"
            role="tabpanel"
            aria-label={detailTab}
          >
            {detailTab === 'structure' && (
              <>
                <div className="section-intro">
                  <h2>最小構成からの積み上げ</h2>
                  <p className="muted">
                    骨格から元の文へ、1行につき1ステップ。登録した順序で表示されます。
                  </p>
                </div>
                <Field
                  label="構文ステップ"
                  value={d.editBuild}
                  onChange={s.setEditBuild}
                  rows={9}
                />
                <ol className="editor-step-preview">
                  {d.editBuild
                    .split(/\r?\n/)
                    .filter(Boolean)
                    .map((text, i) => (
                      <li key={i}>
                        <span>{i + 1}</span>
                        {text}
                      </li>
                    ))}
                </ol>
              </>
            )}
            {detailTab === 'notes' && (
              <>
                <div className="section-intro">
                  <h2>備考・解説メモ</h2>
                  <p className="muted">
                    人名の紹介や背景知識など、1行につき1項目で入力します。
                  </p>
                </div>
                <Field
                  label="備考"
                  value={d.editNotes}
                  onChange={s.setEditNotes}
                  rows={10}
                />
              </>
            )}
            {detailTab === 'new' && (
              <>
                <div className="section-intro">
                  <h2>新しい文を追加</h2>
                  <p className="muted">
                    IDと見出しは自動生成します。追加後は、その文の編集に移ります。
                  </p>
                </div>
                <label className="field">
                  追加位置
                  <select
                    value={d.quickInsertMode}
                    onChange={(e) =>
                      s.setQuickInsertMode(
                        e.target.value as EditorDraft['quickInsertMode']
                      )
                    }
                  >
                    <option value="afterCurrent">今見ている文の直後</option>
                    <option value="end">この章の末尾</option>
                  </select>
                </label>
                <Field
                  label="新しい原文（必須）"
                  value={d.quickSource}
                  onChange={s.setQuickSource}
                  rows={5}
                />
                <Field
                  label="新しい英語訳"
                  value={d.quickEnglish}
                  onChange={s.setQuickEnglish}
                  rows={3}
                />
                <Field
                  label="新しい日本語訳"
                  value={d.quickJapanese}
                  onChange={s.setQuickJapanese}
                  rows={3}
                />
                <details className="advanced-fields">
                  <summary>構文・備考・単語の区切りも入力</summary>
                  <Field
                    label="新しい構文ステップ（1行＝1ステップ）"
                    value={d.quickBuild}
                    onChange={s.setQuickBuild}
                    rows={4}
                  />
                  <Field
                    label="新しい備考（1行＝1項目）"
                    value={d.quickNotes}
                    onChange={s.setQuickNotes}
                    rows={3}
                  />
                  <Field
                    label="新しい単語の区切り（| 区切り）"
                    value={d.quickTokens}
                    onChange={s.setQuickTokens}
                  />
                </details>
              </>
            )}
            {detailTab === 'vocabulary' && (
              <div className="editor-split">
                <div>
                  <div className="section-intro">
                    <h2>単語辞書</h2>
                    <p className="muted">
                      原文をクリック、または語句を選択して登録できます。同じ言語の辞書形も参照できます。
                    </p>
                  </div>
                  <Field
                    label="単語（必須）"
                    value={d.vocabToken}
                    onChange={s.setVocabToken}
                  />
                  <Field
                    label="辞書形（任意）"
                    value={d.vocabLemma}
                    onChange={s.setVocabLemma}
                    placeholder="être"
                    hint="est → être のように手動指定できます。同じ言語の辞書形の情報を参照します。自動判定はしません。"
                  />
                  <Field
                    label="品詞（任意）"
                    value={d.vocabPartOfSpeech}
                    onChange={s.setVocabPartOfSpeech}
                    placeholder="動詞・名詞・慣用表現など"
                  />
                  <button
                    className={
                      p.weakSet.has(dictKey(p.language, d.vocabToken))
                        ? 'active'
                        : ''
                    }
                    disabled={!d.vocabToken.trim()}
                    aria-pressed={p.weakSet.has(
                      dictKey(p.language, d.vocabToken)
                    )}
                    onClick={() => p.onWeak(d.vocabToken)}
                  >
                    苦手フラグ:{' '}
                    {p.weakSet.has(dictKey(p.language, d.vocabToken))
                      ? 'ON'
                      : 'OFF'}
                  </button>
                  <div className="field-pair">
                    <Field
                      label="English"
                      value={d.vocabEnglish}
                      onChange={s.setVocabEnglish}
                    />
                    <Field
                      label="日本語"
                      value={d.vocabJapanese}
                      onChange={s.setVocabJapanese}
                    />
                  </div>
                  <Field
                    label="語源・メモ"
                    value={d.vocabOrigin}
                    onChange={s.setVocabOrigin}
                    rows={3}
                  />
                  <label className="field">
                    性
                    <select
                      value={d.vocabGender}
                      onChange={(e) =>
                        s.setVocabGender(
                          e.target.value as EditorDraft['vocabGender']
                        )
                      }
                    >
                      <option value="">指定なし</option>
                      <option value="m">男性 (m)</option>
                      <option value="f">女性 (f)</option>
                      <option value="n">中性 (n)</option>
                    </select>
                  </label>
                  <Field
                    label="文法参照ID（カンマ区切り）"
                    value={d.vocabGrammarRefs}
                    onChange={s.setVocabGrammarRefs}
                    placeholder="g-etre-present, g-article-gender"
                  />
                  <button onClick={p.onClearVocab}>新規入力・クリア</button>
                  <div className="unresolved">
                    <h3>
                      本文の未登録候補 <small>{p.unresolved.length}</small>
                    </h3>
                    <p className="muted">選択すると辞書フォームに入ります。</p>
                    <div className="row-actions">
                      {p.unresolved.map((token) => (
                        <button
                          key={token}
                          onClick={() => {
                            p.onClearVocab()
                            s.setVocabToken(token)
                          }}
                        >
                          {token}
                        </button>
                      ))}
                      {!p.unresolved.length && (
                        <p className="muted">未登録候補はありません。</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="editor-item-list">
                  <h3>
                    {p.language}の辞書 · {p.vocabEntries.length}語
                  </h3>
                  <Field
                    label="辞書を検索"
                    value={filter}
                    onChange={setFilter}
                  />
                  <ul>
                    {entries.map((entry) => (
                      <li key={entry.token}>
                        <button
                          className={
                            entry.token === d.vocabToken ? 'active' : ''
                          }
                          onClick={() => p.onLoadVocab(entry)}
                        >
                          <strong>{entry.token}</strong>
                          <small>
                            {entry.en || '—'} / {entry.ja || '—'}
                          </small>
                        </button>
                        <button
                          className="text-danger"
                          aria-label={`${entry.token}を削除`}
                          onClick={() => p.onDeleteVocab(entry.token)}
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {detailTab === 'grammar' && (
              <div className="editor-split">
                <div>
                  <div className="section-intro">
                    <h2>文法・活用・慣用表現</h2>
                    <p className="muted">この文に関連する解説を登録します。</p>
                  </div>
                  <Field
                    label="文法タイトル（必須）"
                    value={d.grammarTitle}
                    onChange={s.setGrammarTitle}
                  />
                  <label className="field">
                    種別
                    <select
                      value={d.grammarType}
                      onChange={(e) =>
                        s.setGrammarType(
                          e.target.value as EditorDraft['grammarType']
                        )
                      }
                    >
                      <option value="grammar">文法</option>
                      <option value="conjugation">動詞の活用</option>
                      <option value="pattern">構文</option>
                      <option value="idiom">慣用表現・熟語</option>
                    </select>
                  </label>
                  <Field
                    label="詳細解説"
                    value={d.grammarBody}
                    onChange={s.setGrammarBody}
                    rows={5}
                  />
                  <Field
                    label="タグ（カンマ区切り）"
                    value={d.grammarTags}
                    onChange={s.setGrammarTags}
                  />
                  <Field
                    label="活用表・文法表"
                    value={d.grammarTableRows}
                    onChange={s.setGrammarTableRows}
                    rows={6}
                    placeholder={'人称 | 数 | être\n1 | 単 | suis\n2 | 単 | es'}
                    hint="1行＝1レコード、列は | 区切り。先頭行を見出しとして表示します。"
                  />
                  <details className="advanced-fields">
                    <summary>参照IDを設定</summary>
                    <Field
                      label="文法ID"
                      value={d.grammarId}
                      onChange={s.setGrammarId}
                      hint="新規項目は空欄で自動生成できます。既存IDは単語からの文法参照に使います。"
                    />
                  </details>
                  <button onClick={p.onClearGrammar}>新規入力・クリア</button>
                </div>
                <div className="editor-item-list">
                  <h3>この文の文法事項</h3>
                  <ul>
                    {p.sentence.grammar.map((g) => (
                      <li key={g.id}>
                        <button
                          className={d.grammarId === g.id ? 'active' : ''}
                          onClick={() => p.onLoadGrammar(g)}
                        >
                          <strong>{g.title}</strong>
                          <small>{g.id}</small>
                        </button>
                        <button
                          className="text-danger"
                          onClick={() => p.onDeleteGrammar(g.id)}
                          aria-label={`${g.title}を削除`}
                        >
                          削除
                        </button>
                      </li>
                    ))}
                  </ul>
                  {!p.sentence.grammar.length && (
                    <p className="muted">文法事項は未登録です。</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <footer className="editor-savebar">
            <span className="muted">
              {detailTab === 'new'
                ? '選択した位置へ追加'
                : detailTab === 'vocabulary'
                  ? '言語共通の辞書へ反映'
                  : detailTab === 'grammar'
                    ? 'この文の文法へ反映'
                    : '現在の文へ反映'}
            </span>
            <button
              className="primary"
              disabled={!p.canEdit}
              onClick={
                detailTab === 'new'
                  ? p.onAdd
                  : detailTab === 'vocabulary'
                    ? p.onSaveVocab
                    : detailTab === 'grammar'
                      ? p.onSaveGrammar
                      : p.onSave
              }
            >
              {detailTab === 'new'
                ? '新しい文を追加'
                : detailTab === 'vocabulary'
                  ? '単語を保存'
                  : detailTab === 'grammar'
                    ? '文法を保存'
                    : '文の変更を保存'}
            </button>
          </footer>
        </div>
      </div>
      <details className="danger-zone">
        <summary>この文の削除</summary>
        <p className="muted">
          最後の1文は削除できません。削除前に確認が表示されます。
        </p>
        <button className="danger" onClick={p.onDelete}>
          現在の文を削除
        </button>
      </details>
    </section>
  )
}
