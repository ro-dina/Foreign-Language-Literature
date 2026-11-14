import { isMaterialSnapshot, type MaterialSnapshot } from './materials'
import { createCloudPayload } from './cloudPayload'
export type CloudRecord = {
  owner_id: string
  payload: MaterialSnapshot
  revision: number
  updated_at: string
}
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
export async function materialRequest(
  table: 'reading_studio_drafts' | 'reading_studio_publications',
  token: string,
  query: string,
  init: RequestInit = {}
) {
  if (!url || !key || !token)
    throw new Error('Supabaseの設定とログインを確認してください。')
  const res = await fetch(
    `${url.replace(/\/$/, '')}/rest/v1/${table}${query}`,
    {
      ...init,
      headers: {
        apikey: key,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...init.headers
      }
    }
  )
  if (!res.ok) {
    const raw = await res.json().catch(() => ({}))
    if (res.status === 404 || raw.code === 'PGRST205' || raw.code === '42P01')
      throw new Error(
        '教材保存テーブルが未設定です。追加SQLの承認・適用が必要です。ブラウザのデータは保持しています。'
      )
    if (res.status === 409)
      throw new Error(
        '別の端末で更新されています。状態を再取得して内容を確認してください。'
      )
    if (res.status === 401 || res.status === 403)
      throw new Error(
        '保存権限がありません。ログイン状態とSupabaseの編集者RLSを確認してください。'
      )
    throw new Error(
      `Supabaseへの通信に失敗しました (${res.status})。ローカルの教材は保持しています。`
    )
  }
  return (await res.json()) as CloudRecord[]
}
export async function fetchMaterial(
  token: string,
  owner: string,
  published = false
) {
  const rows = await materialRequest(
    published ? 'reading_studio_publications' : 'reading_studio_drafts',
    token,
    `?owner_id=eq.${encodeURIComponent(owner)}&select=*`
  )
  if (rows[0] && !isMaterialSnapshot(rows[0].payload))
    throw new Error(
      'クラウドの教材形式が不正です。ローカルデータには適用しません。'
    )
  if (rows[0]) {
    checkRecord(rows[0])
    return { ...rows[0], payload: createCloudPayload(rows[0].payload) }
  }
  return null
}
function checkRecord(record: CloudRecord) {
  if (
    !Number.isSafeInteger(record.revision) ||
    record.revision < 1 ||
    !Number.isFinite(Date.parse(record.updated_at))
  ) {
    throw new Error('クラウドの版情報が不正です。状態を再取得してください。')
  }
}
export async function saveMaterial(
  token: string,
  owner: string,
  payload: MaterialSnapshot,
  revision: number | null,
  published = false
) {
  const cleanPayload = createCloudPayload(payload)
  if (revision !== null && (!Number.isSafeInteger(revision) || revision < 1))
    throw new Error('版番号を再取得してください。')
  const rows = await materialRequest(
    published ? 'reading_studio_publications' : 'reading_studio_drafts',
    token,
    revision === null
      ? ''
      : `?owner_id=eq.${encodeURIComponent(owner)}&revision=eq.${revision}`,
    {
      method: revision === null ? 'POST' : 'PATCH',
      body: JSON.stringify({
        ...(revision === null ? { owner_id: owner } : {}),
        payload: cleanPayload
      })
    }
  )
  if (!rows.length)
    throw new Error(
      'クラウドの内容が変更されたか、編集権限がありません。再取得して確認してください。上書きはしていません。'
    )
  checkRecord(rows[0])
  if (rows[0].revision !== (revision === null ? 1 : revision + 1)) {
    throw new Error(
      'DBの版管理設定を確認してください。状態を再取得するまで追加保存を止めてください。'
    )
  }
  return { ...rows[0], payload: createCloudPayload(rows[0].payload) }
}
