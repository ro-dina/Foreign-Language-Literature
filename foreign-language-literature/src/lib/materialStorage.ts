import {
  isMaterialSnapshot,
  RECOVERY_KEY,
  type MaterialSnapshot,
  type Recovery
} from './materials.ts'
type Store = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
function json(store: Store, key: string) {
  try {
    return JSON.parse(store.getItem(key) || 'null')
  } catch {
    return null
  }
}
function protectCopy(store: Store, previous: MaterialSnapshot, reason: string) {
  const copy: Recovery = {
    createdAt: new Date().toISOString(),
    reason,
    snapshot: previous,
    drafts: json(store, 'rsl-react-editor-drafts'),
    progress: json(store, 'rsl-react-progress'),
    vocabularyDrafts: json(store, 'rsl-react-vocabulary-drafts'),
    bulkDraft: json(store, 'rsl-react-bulk-draft'),
    libraryForm: json(store, 'rsl-react-library-form')
  }
  store.setItem(RECOVERY_KEY, JSON.stringify(copy))
}
function writeBundle(store: Store, values: Record<string, string | null>) {
  const previous = Object.fromEntries(
    Object.keys(values).map((key) => [key, store.getItem(key)])
  )
  try {
    for (const [key, value] of Object.entries(values)) {
      if (value === null) store.removeItem(key)
      else store.setItem(key, value)
    }
  } catch (error) {
    for (const [key, value] of Object.entries(previous)) {
      try {
        if (value === null) store.removeItem(key)
        else store.setItem(key, value)
      } catch {
        /* Keep the protection copy available if storage also rejects rollback. */
      }
    }
    throw error
  }
}
export function restoreMaterials(
  store: Store,
  recovery: Recovery,
  current: MaterialSnapshot,
  reason = '保護コピーからの復元'
) {
  if (!isMaterialSnapshot(recovery.snapshot))
    throw new Error('復元データの形式が不正です。')
  protectCopy(store, current, reason)
  const values: Record<string, string | null> = {
    'rsl-react-data': JSON.stringify(recovery.snapshot.data),
    'rsl-react-dict': JSON.stringify(recovery.snapshot.dict)
  }
  for (const [field, key] of [
    ['drafts', 'rsl-react-editor-drafts'],
    ['progress', 'rsl-react-progress'],
    ['vocabularyDrafts', 'rsl-react-vocabulary-drafts'],
    ['bulkDraft', 'rsl-react-bulk-draft'],
    ['libraryForm', 'rsl-react-library-form']
  ] as const) {
    if (recovery[field] !== undefined)
      values[key] =
        recovery[field] === null ? null : JSON.stringify(recovery[field])
  }
  writeBundle(store, values)
}
export function writeMaterials(
  store: Store,
  next: MaterialSnapshot,
  previous: MaterialSnapshot,
  reason: string,
  protect = false
) {
  if (!isMaterialSnapshot(next))
    throw new Error('教材の形式が不正なため保存を中止しました。')
  if (protect) protectCopy(store, previous, reason)
  writeBundle(store, {
    'rsl-react-data': JSON.stringify(next.data),
    'rsl-react-dict': JSON.stringify(next.dict)
  })
}
