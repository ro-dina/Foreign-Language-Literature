import { useState } from 'react'
import {
  fetchMaterial,
  saveMaterial,
  type CloudRecord
} from '../lib/supabaseMaterials'
import type { MaterialSnapshot } from '../lib/materials'
function protectCloudVersion(
  record: CloudRecord | null | undefined,
  published = false
) {
  if (record) {
    try {
      localStorage.setItem(
        published
          ? 'rsl-react-cloud-publication-recovery'
          : 'rsl-react-cloud-draft-recovery',
        JSON.stringify(record)
      )
    } catch {
      throw new Error(
        '直前のクラウド版を保護できないため、保存を中止しました。ブラウザの保存容量を確保してください。'
      )
    }
  }
}
export function CloudMaterials(p: {
  token: string
  userId: string
  canEdit: boolean
  snapshot: MaterialSnapshot
  onApply: (s: MaterialSnapshot) => boolean
  onExport: () => void
}) {
  const [draft, setDraft] = useState<CloudRecord | null | undefined>(undefined),
    [publication, setPublication] = useState<CloudRecord | null | undefined>(
      undefined
    )
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(''),
    [error, setError] = useState(''),
    [publisher, setPublisher] = useState('')
  const run = async (job: () => Promise<void>) => {
    setBusy(true)
    setMessage('')
    setError('')
    try {
      await job()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <section className="cloud-materials">
      <p className="muted">保存・共有の対象はライブラリ全体（全作品と共通辞書）です。ブラウザ保存は同じ端末内でアカウント間でも共通です。</p>
      <div className="storage-stages">
        <div>
          <strong>1. フォーム下書き</strong>
          <p>このブラウザだけに自動保存。教材本体には未反映。</p>
        </div>
        <div>
          <strong>2. ブラウザの教材</strong>
          <p>読書画面とバックアップに使う保存済み教材。</p>
        </div>
        <div>
          <strong>3. Supabaseの保存</strong>
          <p>編集者本人だけが読めるクラウドの保存データ。</p>
        </div>
        <div>
          <strong>4. 共有版</strong>
          <p>明示的な共有操作で、ログイン済みの閲覧者が読める教材。</p>
        </div>
      </div>
      <p className="muted">
        自動アップロード・自動公開はしません。未反映のフォーム下書き、学習進捗、認証情報は送信しません。追加SQLが未適用なら、エラーを表示してブラウザの教材を保持します。
      </p>
      {!p.token ? (
        <p>クラウド保存・共有版の閲覧にはログインが必要です。</p>
      ) : (
        <>
          {p.canEdit && (
            <>
              <div className="row-actions">
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      setDraft(await fetchMaterial(p.token, p.userId))
                      setPublication(
                        await fetchMaterial(p.token, p.userId, true)
                      )
                      setMessage(
                        'クラウドの状態を取得しました。ローカルの教材は変更していません。'
                      )
                    })
                  }
                >
                  Supabaseの状態を確認
                </button>
                <button
                  disabled={busy || draft === undefined}
                  onClick={() =>
                    run(async () => {
                      if (
                        !window.confirm(
                          'ブラウザの保存済み教材を、Supabaseの非公開保存データへ反映しますか？フォーム下書きは含みません。'
                        )
                      )
                        return
                      protectCloudVersion(draft)
                      const saved = await saveMaterial(
                        p.token,
                        p.userId,
                        p.snapshot,
                        draft?.revision || null
                      )
                      setDraft(saved)
                      setMessage(
                        `Supabaseへ非公開で保存しました (版 ${saved.revision})。共有版は変更していません。`
                      )
                    })
                  }
                >
                  Supabaseに保存（非公開）
                </button>
                <button
                  disabled={busy || !draft}
                  onClick={() => {
                    if (draft && p.onApply(draft.payload))
                      setMessage(
                        'Supabaseの教材をブラウザへ復元しました。ローカル下書きは保護コピーとともに保持しています。'
                      )
                  }}
                >
                  Supabaseから復元
                </button>
              </div>
              <p className="muted">
                非公開保存:{' '}
                {draft === undefined
                  ? '未確認'
                  : draft
                    ? `版 ${draft.revision} · ${new Date(draft.updated_at).toLocaleString()}`
                    : 'まだ保存されていません'}
              </p>
              <div className="row-actions">
                <button
                  disabled={busy || !draft || publication === undefined}
                  onClick={() =>
                    run(async () => {
                      if (
                        !draft ||
                        !window.confirm(
                          'Supabaseに保存した全作品と共通辞書を、ログイン済みの閲覧者全員に共有しますか？非公開の保存内容とは別に保持します。'
                        )
                      )
                        return
                      protectCloudVersion(publication, true)
                      const saved = await saveMaterial(
                        p.token,
                        p.userId,
                        draft.payload,
                        publication?.revision || null,
                        true
                      )
                      setPublication(saved)
                      setMessage(
                        `共有版を更新しました (版 ${saved.revision})。`
                      )
                    })
                  }
                >
                  保存済みの版を共有する
                </button>
              </div>
              <p className="muted">
                共有版:{' '}
                {publication === undefined
                  ? '未確認'
                  : publication
                    ? `版 ${publication.revision}`
                    : '未共有'}
              </p>
              <div className="row-actions">
                {[false, true].map((published) => (
                  <button
                    key={String(published)}
                    disabled={busy}
                    onClick={() => {
                      try {
                        const previous = JSON.parse(
                          localStorage.getItem(
                            published
                              ? 'rsl-react-cloud-publication-recovery'
                              : 'rsl-react-cloud-draft-recovery'
                          ) || 'null'
                        ) as CloudRecord | null
                        if (!previous || previous.owner_id !== p.userId) {
                          setError(
                            'このアカウントの直前の保護コピーがありません。'
                          )
                          return
                        }
                        if (p.onApply(previous.payload))
                          setMessage(
                            '直前のクラウド版をブラウザに復元しました。クラウドの版は変更していません。'
                          )
                      } catch {
                        setError('保護コピーを読み込めません。')
                      }
                    }}
                  >
                    {published
                      ? '直前の共有版をローカルに復元'
                      : '直前の非公開版をローカルに復元'}
                  </button>
                ))}
              </div>
            </>
          )}
          <details>
            <summary>共有された教材を開く</summary>
            <label className="field">
              教材作成者のユーザーID
              <input
                value={publisher}
                onChange={(e) => setPublisher(e.target.value)}
                placeholder="教材作成者から受け取ったUUID"
              />
            </label>
            {p.canEdit && (
              <p className="muted">
                自分の共有ID: <code>{p.userId}</code>
              </p>
            )}
            <button
              disabled={busy || !publisher.trim()}
              onClick={() =>
                run(async () => {
                  const item = await fetchMaterial(
                    p.token,
                    publisher.trim(),
                    true
                  )
                  if (!item) {
                    setMessage('共有版が見つかりません。')
                    return
                  }
                  if (p.onApply(item.payload))
                    setMessage('共有版をブラウザへ読み込みました。')
                })
              }
            >
              共有版を読み込む
            </button>
          </details>
        </>
      )}
      <button onClick={p.onExport}>ローカルのバックアップを書き出す</button>
      {message && (
        <p role="status" className="success-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  )
}
