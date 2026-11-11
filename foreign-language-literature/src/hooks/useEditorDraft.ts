import { useEffect, useState } from 'react'
import type { Sentence } from '../models'

export const DRAFT_STORAGE = 'rsl-react-editor-drafts'

export type EditorDraft = {
  quickSource: string
  quickEnglish: string
  quickJapanese: string
  quickBuild: string
  quickNotes: string
  quickTokens: string
  quickInsertMode: 'afterCurrent' | 'end'
  editLabel: string
  editSource: string
  editEnglish: string
  editJapanese: string
  editBuild: string
  editNotes: string
  editTokens: string
  vocabToken: string
  vocabEnglish: string
  vocabJapanese: string
  vocabOrigin: string
  vocabGender: '' | 'm' | 'f' | 'n'
  vocabGrammarRefs: string
  grammarId: string
  grammarType: 'grammar' | 'conjugation' | 'pattern' | 'idiom'
  grammarTitle: string
  grammarBody: string
  grammarTags: string
  grammarTableRows: string
}

export type DraftSetters = {
  [K in keyof EditorDraft as `set${Capitalize<K>}`]: (
    value: EditorDraft[K]
  ) => void
}

export function initialDraft(sentence?: Sentence): EditorDraft {
  return {
    quickSource: '',
    quickEnglish: '',
    quickJapanese: '',
    quickBuild: '',
    quickNotes: '',
    quickTokens: '',
    quickInsertMode: 'afterCurrent',
    editLabel: sentence?.label || '',
    editSource: sentence?.source || '',
    editEnglish: sentence?.english || '',
    editJapanese: sentence?.japanese || '',
    editBuild: (sentence?.buildUp || []).join('\n'),
    editNotes: (sentence?.notes || []).join('\n'),
    editTokens: (sentence?.tokens || []).map((t) => t.text).join(' | '),
    vocabToken: '',
    vocabEnglish: '',
    vocabJapanese: '',
    vocabOrigin: '',
    vocabGender: '',
    vocabGrammarRefs: '',
    grammarId: '',
    grammarType: 'grammar',
    grammarTitle: '',
    grammarBody: '',
    grammarTags: '',
    grammarTableRows: ''
  }
}

function readDraft(key: string, sentence?: Sentence): EditorDraft {
  try {
    const saved = JSON.parse(localStorage.getItem(DRAFT_STORAGE) || '{}')[key]
    const base = initialDraft(sentence)
    if (!saved || typeof saved !== 'object') return base
    for (const field of Object.keys(base) as (keyof EditorDraft)[]) {
      if (typeof saved[field] !== 'string') delete saved[field]
    }
    return { ...base, ...saved }
  } catch {
    return initialDraft(sentence)
  }
}

export function useEditorDraft(key: string, sentence?: Sentence) {
  const [state, setState] = useState(() => ({
    key,
    values: readDraft(key, sentence)
  }))
  const [error, setError] = useState('')
  // Reinitialize before rendering the new sentence. Effects never save the previous sentence under the new key.
  if (state.key !== key) setState({ key, values: readDraft(key, sentence) })
  useEffect(() => {
    if (!key || state.key !== key) return
    try {
      const all = JSON.parse(localStorage.getItem(DRAFT_STORAGE) || '{}')
      all[key] = state.values
      localStorage.setItem(DRAFT_STORAGE, JSON.stringify(all))
      queueMicrotask(() => setError(''))
    } catch {
      queueMicrotask(() =>
        setError(
          '下書きを保存できません。ブラウザの保存容量・設定を確認してください。'
        )
      )
    }
  }, [key, state])
  const setters = Object.fromEntries(
    Object.keys(state.values).map((field) => [
      'set' + field[0].toUpperCase() + field.slice(1),
      (value: string) =>
        setState((prev) => ({
          ...prev,
          values: { ...prev.values, [field]: value }
        }))
    ])
  ) as DraftSetters
  return { values: state.values, setters, error }
}
