import type { DictEntry, Token } from '../models'
import { sourceParts, mergeToken } from './reading.ts'
export function hasVocabularyData(entry?: Token | DictEntry) {
  return (
    !!entry &&
    (!!entry.en?.trim() ||
      !!entry.ja?.trim() ||
      !!entry.origin?.trim() ||
      !!entry.gender ||
      !!entry.lemma ||
      !!entry.partOfSpeech ||
      !!entry.grammarRefs?.length)
  )
}
export function editorWords(
  source: string,
  language: string,
  tokens: Token[],
  dict: Record<string, DictEntry>
) {
  const known = new Map<string, Token>()
  tokens.forEach((t) => known.set(t.text, t))
  Object.values(dict)
    .filter((e) => e.sourceLanguage === language)
    .forEach((e) => {
      if (!known.has(e.token)) known.set(e.token, { text: e.token })
    })
  const parts = sourceParts(source, [...known.values()])
  const segmenter = new Intl.Segmenter(
    (
      {
        フランス語: 'fr',
        ロシア語: 'ru',
        ドイツ語: 'de',
        英語: 'en',
        中国語: 'zh'
      } as Record<string, string>
    )[language] || 'en',
    { granularity: 'word' }
  )
  return parts.flatMap((p) =>
    p.token
      ? [
          {
            text: p.text,
            word: true,
            token: mergeToken(language, p.token, dict)
          }
        ]
      : [...segmenter.segment(p.text)].map((s) => ({
          text: s.segment,
          word: !!s.isWordLike,
          token: { text: s.segment } as Token
        }))
  )
}
