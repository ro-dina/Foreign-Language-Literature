import type { DictEntry, GrammarItem, Token } from '../models'
import { isMaterialSnapshot, type MaterialSnapshot } from './materials.ts'

function invalid(): never {
  throw new Error('教材項目の形式が不正です。クラウドへは送信していません。')
}
function id(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : invalid()
}
function text(value: unknown): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'string' ? value : invalid()
}
function strings(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string'))
    return invalid()
  return [...value]
}
function gender(value: unknown): Token['gender'] {
  if (
    value === undefined ||
    value === '' ||
    value === 'm' ||
    value === 'f' ||
    value === 'n'
  )
    return value
  return invalid()
}
function token(value: Token): Token {
  return {
    text: value.text,
    en: text(value.en),
    ja: text(value.ja),
    origin: text(value.origin),
    gender: gender(value.gender),
    lemma: text(value.lemma),
    partOfSpeech: text(value.partOfSpeech),
    grammarRefs:
      value.grammarRefs === undefined ? undefined : strings(value.grammarRefs)
  }
}
function grammar(value: GrammarItem): GrammarItem {
  if (
    value.type !== undefined &&
    !['grammar', 'conjugation', 'pattern', 'idiom'].includes(value.type)
  )
    return invalid()
  if (value.tableRows !== undefined && !Array.isArray(value.tableRows))
    return invalid()
  return {
    id: value.id,
    title: value.title,
    body: value.body,
    type: value.type,
    tags: value.tags === undefined ? undefined : strings(value.tags),
    tableRows: value.tableRows?.map(strings)
  }
}

// Construct every level explicitly. A typed object can still carry arbitrary
// properties from an imported JSON backup; never stringify it directly for upload.
export function createCloudPayload(input: unknown): MaterialSnapshot {
  if (!isMaterialSnapshot(input)) return invalid()
  const data = input.data.map((work) => ({
    id: id(work.id),
    title: work.title,
    sourceLanguage: work.sourceLanguage,
    author: text(work.author),
    sections: work.sections.map((section) => ({
      id: id(section.id),
      title: section.title,
      description: text(section.description),
      sentences: section.sentences.map((sentence) => ({
        id: id(sentence.id),
        label: sentence.label,
        source: sentence.source,
        english: sentence.english,
        japanese: sentence.japanese,
        tokens: sentence.tokens.map(token),
        buildUp: strings(sentence.buildUp),
        notes: strings(sentence.notes),
        grammar: sentence.grammar.map(grammar)
      }))
    }))
  }))
  const dict = Object.fromEntries(
    Object.entries(input.dict).map(([key, entry]) => {
      if (entry.gender === undefined) return invalid()
      const clean: DictEntry = {
        sourceLanguage: entry.sourceLanguage,
        token: entry.token,
        en: entry.en,
        ja: entry.ja,
        origin: entry.origin,
        gender: gender(entry.gender)!,
        grammarRefs: strings(entry.grammarRefs),
        lemma: text(entry.lemma),
        partOfSpeech: text(entry.partOfSpeech)
      }
      return [key, clean]
    })
  )
  // Match the wire representation, including omission of optional undefined fields.
  return JSON.parse(
    JSON.stringify({ version: 1, data, dict })
  ) as MaterialSnapshot
}
