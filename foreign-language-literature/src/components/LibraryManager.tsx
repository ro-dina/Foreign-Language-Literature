import { useState } from 'react'
import type { Work } from '../models'
import { newId, reordered } from '../lib/materials'
import { Tabs } from './Tabs'
import { BulkImporter, type BulkRequest } from './BulkImporter'
import { usePersistentForm } from '../hooks/usePersistentForm'
export function LibraryManager(p: {
  data: Work[]
  workId: string
  onCommit: (data: Work[], reason: string, protect?: boolean) => boolean
  onSelect: (w: string, s: string, x: string) => void
  onBulk: (r: BulkRequest) => boolean
  onRestore: () => boolean
  onExport: () => void
}) {
  const [tab, setTab] = useState<'works' | 'chapters' | 'bulk' | 'recovery'>(
    'works'
  )
  const [form, setForm, error] = usePersistentForm('rsl-react-library-form', {
    workId: p.workId,
    editing: '',
    title: '',
    author: '',
    language: 'フランス語',
    sectionId: '',
    sectionTitle: '',
    description: ''
  })
  const [message, setMessage] = useState('')
  const work = p.data.find((w) => w.id === form.workId) || p.data[0]
  const change = (patch: Partial<typeof form>) =>
    setForm((v) => ({ ...v, ...patch }))
  const run = (next: Work[], reason: string, protect = false) => {
    const ok = p.onCommit(next, reason, protect)
    setMessage(
      ok
        ? `${reason}しました。`
        : '保存できません。保護コピーと保存容量を確認してください。'
    )
    return ok
  }
  const editWork = (w: Work) =>
    change({
      workId: w.id,
      editing: w.id,
      title: w.title,
      author: w.author || '',
      language: w.sourceLanguage,
      sectionId: '',
      sectionTitle: '',
      description: ''
    })
  return (
    <section className="library-manager">
      <p className="muted">
        作品・章の順序は、そのまま読書の順序になります。変更はブラウザに保存し、クラウドへの保存・共有は別途行います。
      </p>
      <Tabs
        label="ライブラリ管理項目"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'works', label: '作品' },
          { id: 'chapters', label: '章' },
          { id: 'bulk', label: '本文一括登録' },
          { id: 'recovery', label: 'データ保護' }
        ]}
      />
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-message" role="status">
          {message}
        </p>
      )}
      {tab === 'works' && (
        <div className="manager-grid">
          <div>
            <h2>{form.editing ? '作品の編集' : '新しい作品'}</h2>
            <label className="field">
              作品名
              <input
                value={form.title}
                onChange={(e) => change({ title: e.target.value })}
              />
            </label>
            <label className="field">
              著者名
              <input
                value={form.author}
                onChange={(e) => change({ author: e.target.value })}
              />
            </label>
            <label className="field">
              原文言語
              <input
                list="studio-languages"
                value={form.language}
                onChange={(e) => change({ language: e.target.value })}
              />
              <datalist id="studio-languages">
                {[
                  'フランス語',
                  'ロシア語',
                  'ドイツ語',
                  '英語',
                  '中国語',
                  '日本語'
                ].map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </datalist>
            </label>
            <div className="row-actions">
              <button
                className="primary"
                onClick={() => {
                  if (!form.title.trim() || !form.language.trim()) {
                    setMessage('作品名と原文言語は必須です。')
                    return
                  }
                  const old = p.data.find((w) => w.id === form.editing)
                  if (
                    old &&
                    old.sourceLanguage !== form.language.trim() &&
                    !window.confirm(
                      '原文言語を変更すると参照する共通辞書が変わります。既存の辞書は保持します。続けますか？'
                    )
                  )
                    return
                  const item: Work = {
                    ...(old || { id: newId('work'), sections: [] }),
                    title: form.title.trim(),
                    author: form.author.trim(),
                    sourceLanguage: form.language.trim()
                  }
                  if (
                    run(
                      old
                        ? p.data.map((w) => (w.id === old.id ? item : w))
                        : [...p.data, item],
                      old ? '作品を更新' : '作品を作成'
                    )
                  ) {
                    editWork(item)
                    p.onSelect(
                      item.id,
                      item.sections[0]?.id || '',
                      item.sections[0]?.sentences[0]?.id || ''
                    )
                    if (!old) setTab('chapters')
                  }
                }}
              >
                {form.editing ? '作品を更新' : '作品を作成'}
              </button>
              <button
                onClick={() =>
                  change({
                    editing: '',
                    title: '',
                    author: '',
                    language: 'フランス語'
                  })
                }
              >
                新規作品の入力
              </button>
            </div>
          </div>
          <ol className="manager-list">
            {p.data.map((w, i) => (
              <li key={w.id}>
                <button className="manager-item" onClick={() => editWork(w)}>
                  <strong>{w.title}</strong>
                  <small>
                    {w.author || '著者未設定'} · {w.sourceLanguage}
                  </small>
                </button>
                <div className="row-actions">
                  <button
                    aria-label={`${w.title}を上へ`}
                    disabled={i === 0}
                    onClick={() =>
                      run(reordered(p.data, i, -1), '作品の順序を変更')
                    }
                  >
                    ↑
                  </button>
                  <button
                    aria-label={`${w.title}を下へ`}
                    disabled={i === p.data.length - 1}
                    onClick={() =>
                      run(reordered(p.data, i, 1), '作品の順序を変更')
                    }
                  >
                    ↓
                  </button>
                  <button
                    className="text-danger"
                    onClick={() => {
                      if (
                        window.confirm(
                          `作品「${w.title}」と全ての章・文をブラウザの教材から削除しますか？直前の保護コピーから復元できます。クラウドには自動反映しません。`
                        ) &&
                        run(
                          p.data.filter((x) => x.id !== w.id),
                          '作品を削除',
                          true
                        )
                      ) {
                        if (form.editing === w.id)
                          change({ editing: '', title: '', author: '' })
                      }
                    }}
                  >
                    削除
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
      {tab === 'chapters' && (
        <>
          <label className="field">
            対象作品
            <select
              value={work?.id || ''}
              onChange={(e) =>
                change({
                  workId: e.target.value,
                  sectionId: '',
                  sectionTitle: '',
                  description: ''
                })
              }
            >
              <option value="" disabled>
                作品を選択
              </option>
              {p.data.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title}
                </option>
              ))}
            </select>
          </label>
          {work ? (
            <div className="manager-grid">
              <div>
                <h2>{form.sectionId ? '章の編集' : '新しい章'}</h2>
                <label className="field">
                  章タイトル
                  <input
                    value={form.sectionTitle}
                    onChange={(e) => change({ sectionTitle: e.target.value })}
                  />
                </label>
                <label className="field">
                  章の解説
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) => change({ description: e.target.value })}
                  />
                </label>
                <div className="row-actions">
                  <button
                    className="primary"
                    onClick={() => {
                      if (!form.sectionTitle.trim()) {
                        setMessage('章タイトルを入力してください。')
                        return
                      }
                      const old = work.sections.find(
                        (s) => s.id === form.sectionId
                      )
                      const section = {
                        ...(old || { id: newId('section'), sentences: [] }),
                        title: form.sectionTitle.trim(),
                        description: form.description.trim()
                      }
                      if (
                        run(
                          p.data.map((w) =>
                            w.id === work.id
                              ? {
                                  ...w,
                                  sections: old
                                    ? w.sections.map((s) =>
                                        s.id === old.id ? section : s
                                      )
                                    : [...w.sections, section]
                                }
                              : w
                          ),
                          old ? '章を更新' : '章を作成'
                        )
                      ) {
                        change({ sectionId: section.id })
                        p.onSelect(
                          work.id,
                          section.id,
                          section.sentences[0]?.id || ''
                        )
                      }
                    }}
                  >
                    {form.sectionId ? '章を更新' : '章を作成'}
                  </button>
                  <button
                    onClick={() =>
                      change({
                        sectionId: '',
                        sectionTitle: '',
                        description: ''
                      })
                    }
                  >
                    新規章の入力
                  </button>
                  <button onClick={() => setTab('bulk')}>
                    原文をまとめて登録 →
                  </button>
                </div>
              </div>
              <ol className="manager-list">
                {work.sections.map((s, i) => (
                  <li key={s.id}>
                    <button
                      className="manager-item"
                      onClick={() =>
                        change({
                          sectionId: s.id,
                          sectionTitle: s.title,
                          description: s.description || ''
                        })
                      }
                    >
                      <strong>{s.title}</strong>
                      <small>{s.sentences.length}文</small>
                    </button>
                    <div className="row-actions">
                      <button
                        disabled={!i}
                        aria-label={`${s.title}を上へ`}
                        onClick={() =>
                          run(
                            p.data.map((w) =>
                              w.id === work.id
                                ? {
                                    ...w,
                                    sections: reordered(w.sections, i, -1)
                                  }
                                : w
                            ),
                            '章の順序を変更'
                          )
                        }
                      >
                        ↑
                      </button>
                      <button
                        disabled={i === work.sections.length - 1}
                        aria-label={`${s.title}を下へ`}
                        onClick={() =>
                          run(
                            p.data.map((w) =>
                              w.id === work.id
                                ? {
                                    ...w,
                                    sections: reordered(w.sections, i, 1)
                                  }
                                : w
                            ),
                            '章の順序を変更'
                          )
                        }
                      >
                        ↓
                      </button>
                      <button
                        className="text-danger"
                        onClick={() => {
                          if (
                            window.confirm(
                              `章「${s.title}」と${s.sentences.length}文を削除しますか？直前の保護コピーを作成してから削除します。`
                            ) &&
                            run(
                              p.data.map((w) =>
                                w.id === work.id
                                  ? {
                                      ...w,
                                      sections: w.sections.filter(
                                        (x) => x.id !== s.id
                                      )
                                    }
                                  : w
                              ),
                              '章を削除',
                              true
                            )
                          )
                            change({
                              sectionId: '',
                              sectionTitle: '',
                              description: ''
                            })
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <p>先に作品を作成してください。</p>
          )}
        </>
      )}
      {tab === 'bulk' && (
        <BulkImporter
          data={p.data}
          workId={work?.id || ''}
          onCommit={p.onBulk}
        />
      )}
      {tab === 'recovery' && (
        <>
          <h2>データの保護</h2>
          <p className="muted">
            削除・一括登録・復元の前に教材・辞書・下書き・進捗の保護コピーを作成します。保存容量不足なら処理を中止します。保護コピーは直前の1件です。
          </p>
          <div className="row-actions">
            <button onClick={p.onExport}>バックアップを書き出す</button>
            <button
              onClick={() => {
                if (p.onRestore())
                  setMessage('直前の保護コピーを復元しました。')
              }}
            >
              直前の保護コピーから復元
            </button>
          </div>
        </>
      )}
    </section>
  )
}
