import type { DictEntry, Sentence, Work } from '../models'

export const EMPTY_SENTENCE: Sentence = {
  id: '',
  label: '文を追加してください',
  source: '',
  english: '',
  japanese: '',
  tokens: [],
  buildUp: [],
  notes: [],
  grammar: []
}
export const EMPTY_SECTION = {
  id: '',
  title: '章を作成してください',
  sentences: [] as Sentence[]
}
export const EMPTY_WORK: Work = {
  id: '',
  title: '作品を選択してください',
  sourceLanguage: '',
  sections: []
}
export const RECOVERY_KEY = 'rsl-react-recovery'
export type MaterialSnapshot = {
  version: 1
  data: Work[]
  dict: Record<string, DictEntry>
}
export type Recovery = {
  createdAt: string
  reason: string
  snapshot: MaterialSnapshot
  drafts: unknown
  progress: unknown
  vocabularyDrafts?: unknown
  bulkDraft?: unknown
  libraryForm?: unknown
}
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
export function newSentence(source: string): Sentence {
  return {
    id: newId('sentence'),
    label: source.slice(0, 70),
    source,
    english: '',
    japanese: '',
    tokens: [],
    buildUp: [source],
    notes: [],
    grammar: []
  }
}
export function reordered<T>(list: T[], index: number, offset: number) {
  const next = [...list],
    to = index + offset
  if (index < 0 || to < 0 || index >= list.length || to >= list.length)
    return next
  ;[next[index], next[to]] = [next[to], next[index]]
  return next
}
export function isMaterialSnapshot(value: unknown): value is MaterialSnapshot {
  if (!value || typeof value !== 'object') return false
  const p = value as MaterialSnapshot
  if (
    p.version !== 1 ||
    !Array.isArray(p.data) ||
    !p.dict ||
    typeof p.dict !== 'object' ||
    Array.isArray(p.dict)
  )
    return false
  const ids = new Set<string>()
  return (
    p.data.every((w) => {
      if (
        !w ||
        typeof w.id !== 'string' ||
        !w.id ||
        ids.has(w.id) ||
        typeof w.title !== 'string' ||
        typeof w.sourceLanguage !== 'string' ||
        !Array.isArray(w.sections)
      )
        return false
      ids.add(w.id)
      const sectionIds = new Set<string>()
      return w.sections.every((s) => {
        if (
          !s ||
          !s.id ||
          sectionIds.has(s.id) ||
          typeof s.title !== 'string' ||
          !Array.isArray(s.sentences)
        )
          return false
        sectionIds.add(s.id)
        const sentenceIds = new Set<string>()
        return s.sentences.every((x) => {
          if (
            !x ||
            !x.id ||
            sentenceIds.has(x.id) ||
            typeof x.source !== 'string' ||
            typeof x.label !== 'string' ||
            typeof x.english !== 'string' ||
            typeof x.japanese !== 'string'
          )
            return false
          sentenceIds.add(x.id)
          return (
            Array.isArray(x.tokens) &&
            x.tokens.every((t) => t && typeof t.text === 'string') &&
            Array.isArray(x.buildUp) &&
            x.buildUp.every((t) => typeof t === 'string') &&
            Array.isArray(x.notes) &&
            x.notes.every((t) => typeof t === 'string') &&
            Array.isArray(x.grammar) &&
            x.grammar.every(
              (g) =>
                g &&
                typeof g.id === 'string' &&
                typeof g.title === 'string' &&
                typeof g.body === 'string'
            )
          )
        })
      })
    }) &&
    Object.values(p.dict).every(
      (e) =>
        e &&
        typeof e.token === 'string' &&
        typeof e.sourceLanguage === 'string' &&
        typeof e.en === 'string' &&
        typeof e.ja === 'string' &&
        typeof e.origin === 'string' &&
        Array.isArray(e.grammarRefs)
    )
  )
}
