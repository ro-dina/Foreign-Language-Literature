import { useRef, useState } from 'react'
import type { Sentence, Work } from '../models'
import { newId, newSentence } from '../lib/materials'
import { splitSentences } from '../lib/sentenceSplit'
import { usePersistentForm } from '../hooks/usePersistentForm'
export type BulkRequest = {
  workId: string
  sectionId: string
  title: string
  newSectionId: string
  sentences: Sentence[]
}
export function BulkImporter(p: {
  data: Work[]
  workId: string
  onCommit: (request: BulkRequest) => boolean
}) {
  const [form, setForm, error] = usePersistentForm('rsl-react-bulk-draft', {
    workId: p.workId,
    sectionId: '',
    title: '',
    raw: '',
    rows: [] as Sentence[],
    newSectionId: newId('section'),
    done: false
  })
  const [message, setMessage] = useState(''),
    [page, setPage] = useState(0)
  const fields = useRef(new Map<string, HTMLTextAreaElement>())
  const work = p.data.find((w) => w.id === form.workId)
  const change = (patch: Partial<typeof form>) => {
    setForm((v) => ({ ...v, ...patch }))
    setMessage('')
  }
  const makePreview = () => {
    const rows = splitSentences(form.raw).map(newSentence)
    if (!rows.length) {
      setMessage('原文を入力してください。')
      return
    }
    change({ rows, newSectionId: newId('section'), done: false })
    setPage(0)
  }
  const commit = () => {
    if (form.done) return
    if (
      !work ||
      (!form.sectionId && !form.title.trim()) ||
      !form.rows.length ||
      form.rows.some((r) => !r.source.trim())
    ) {
      setMessage('作品・章タイトル・空欄のない分割結果を確認してください。')
      return
    }
    if (
      !window.confirm(
        `${form.rows.length}文を${form.sectionId ? '選択した章の末尾' : '新しい章'}へ登録しますか？`
      )
    )
      return
    if (
      p.onCommit({
        workId: work.id,
        sectionId: form.sectionId,
        title: form.title.trim(),
        newSectionId: form.newSectionId,
        sentences: form.rows.map((r) => ({
          ...r,
          source: r.source.trim(),
          label: r.source.trim().slice(0, 70),
          buildUp: [r.source.trim()]
        }))
      })
    ) {
      change({ done: true })
      setMessage('登録しました。ライブラリに反映されています。')
    } else
      setMessage(
        '登録できませんでした。重複登録・保存容量・作品の存在を確認してください。'
      )
  }
  return (
    <div className="bulk-importer">
      <h2>本文をまとめて教材化</h2>
      <p className="muted">
        分割は候補です。略語・会話文・省略記号を確認し、プレビューで調整してから確定します。
      </p>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <div className="field-pair">
        <label className="field">
          1. 作品
          <select
            value={form.workId}
            disabled={form.done}
            onChange={(e) => change({ workId: e.target.value, sectionId: '' })}
          >
            <option value="">作品を選択</option>
            {p.data.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          2. 追加先
          <select
            value={form.sectionId}
            disabled={form.done}
            onChange={(e) => change({ sectionId: e.target.value })}
          >
            <option value="">新しい章を作成</option>
            {work?.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} の末尾
              </option>
            ))}
          </select>
        </label>
      </div>
      {!form.sectionId && (
        <label className="field">
          新しい章タイトル
          <input
            value={form.title}
            disabled={form.done}
            onChange={(e) => change({ title: e.target.value })}
          />
        </label>
      )}
      <label className="field">
        3. 長い原文を貼り付け
        <textarea
          rows={7}
          value={form.raw}
          disabled={form.done}
          onChange={(e) => change({ raw: e.target.value })}
        />
      </label>
      <div className="row-actions">
        <button onClick={makePreview} disabled={form.done || !form.raw.trim()}>
          文に分割してプレビュー
        </button>
        {form.rows.length > 0 && !form.done && (
          <span className="muted">
            原文を変更した後は、必要なら再分割してください。
          </span>
        )}
      </div>
      {!!form.rows.length && (
        <>
          <div className="panel-heading">
            <h3>4. 分割結果 · {form.rows.length}文</h3>
            <div className="row-actions">
              <button disabled={page === 0} onClick={() => setPage(page - 1)}>
                前の20文
              </button>
              <span>
                {page + 1} / {Math.ceil(form.rows.length / 20)}
              </span>
              <button
                disabled={(page + 1) * 20 >= form.rows.length}
                onClick={() => setPage(page + 1)}
              >
                次の20文
              </button>
            </div>
          </div>
          {form.rows.slice(page * 20, page * 20 + 20).map((row, offset) => {
            const i = page * 20 + offset
            return (
              <div className="bulk-row" key={row.id}>
                <label className="field">
                  文 {i + 1}
                  <textarea
                    aria-label={`分割文 ${i + 1}`}
                    ref={(el) => {
                      if (el) fields.current.set(row.id, el)
                      else fields.current.delete(row.id)
                    }}
                    value={row.source}
                    disabled={form.done}
                    rows={3}
                    onChange={(e) =>
                      change({
                        rows: form.rows.map((r) =>
                          r.id === row.id ? { ...r, source: e.target.value } : r
                        )
                      })
                    }
                  />
                </label>
                <div className="row-actions">
                  <button
                    disabled={form.done || i === form.rows.length - 1}
                    onClick={() =>
                      change({
                        rows: form.rows.flatMap((r, n) =>
                          n === i
                            ? [
                                {
                                  ...r,
                                  source:
                                    r.source + ' ' + form.rows[i + 1].source
                                }
                              ]
                            : n === i + 1
                              ? []
                              : [r]
                        )
                      })
                    }
                  >
                    次の文と結合
                  </button>
                  <button
                    disabled={form.done}
                    onClick={() => {
                      const pos =
                        fields.current.get(row.id)?.selectionStart || 0
                      if (pos <= 0 || pos >= row.source.length) {
                        setMessage('分割したい位置にカーソルを置いてください。')
                        return
                      }
                      change({
                        rows: form.rows.flatMap((r, n) =>
                          n === i
                            ? [
                                { ...r, source: r.source.slice(0, pos).trim() },
                                newSentence(r.source.slice(pos).trim())
                              ]
                            : [r]
                        )
                      })
                    }}
                  >
                    カーソル位置で分割
                  </button>
                  <button
                    disabled={form.done || form.rows.length === 1}
                    className="text-danger"
                    onClick={() => {
                      if (
                        window.confirm(`プレビューの文 ${i + 1}を除きますか？`)
                      ) {
                        const rows = form.rows.filter((r) => r.id !== row.id)
                        change({ rows })
                        setPage(
                          Math.min(
                            page,
                            Math.max(0, Math.ceil(rows.length / 20) - 1)
                          )
                        )
                      }
                    }}
                  >
                    除く
                  </button>
                </div>
              </div>
            )
          })}
          <div className="editor-savebar">
            <span className="muted">保存先: このブラウザの教材</span>
            <button className="primary" disabled={form.done} onClick={commit}>
              {form.done ? '登録済み' : '確定して登録'}
            </button>
          </div>
        </>
      )}
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      {form.done && (
        <button
          onClick={() => {
            change({
              raw: '',
              rows: [],
              title: '',
              newSectionId: newId('section'),
              done: false
            })
            setPage(0)
          }}
        >
          別の本文を登録
        </button>
      )}
    </div>
  )
}
