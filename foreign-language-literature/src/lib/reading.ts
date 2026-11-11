import type { DictEntry, Token } from '../models'

export const dictKey = (language: string, token: string) =>
  `${language}::${token}`
export const sentenceKey = (w: string, s: string, x: string) =>
  `${w}::${s}::${x}`

export function mergeToken(
  language: string,
  token: Token,
  dict: Record<string, DictEntry>
): Token {
  const entry = dict[dictKey(language, token.text)]
  return {
    ...entry,
    ...token,
    text: token.text,
    en: entry?.en ?? token.en ?? '',
    ja: entry?.ja ?? token.ja ?? '',
    origin: entry?.origin ?? token.origin ?? '',
    gender: entry?.gender ?? token.gender ?? '',
    grammarRefs: [
      ...new Set([...(token.grammarRefs || []), ...(entry?.grammarRefs || [])])
    ]
  }
}

// Match annotations to the original text without reconstructing it from a partial token list.
export function sourceParts(source: string, tokens: Token[]) {
  const needsBoundary = (char: string) =>
    /[\p{Script=Latin}\p{Script=Cyrillic}\p{Script=Greek}\p{N}\p{M}]/u.test(
      char
    )
  const ordered = [...tokens]
    .filter((t) => t.text)
    .sort((a, b) => b.text.length - a.text.length)
  const parts: { text: string; token?: Token }[] = []
  let plain = ''
  for (let pos = 0; pos < source.length;) {
    const token = ordered.find(
      (t) =>
        source.startsWith(t.text, pos) &&
        !(needsBoundary(t.text[0]) && needsBoundary(source[pos - 1] || '')) &&
        !(
          needsBoundary(t.text.at(-1) || '') &&
          needsBoundary(source[pos + t.text.length] || '')
        )
    )
    if (token) {
      if (plain) parts.push({ text: plain })
      plain = ''
      parts.push({ text: token.text, token })
      pos += token.text.length
    } else {
      plain += source[pos]
      pos++
    }
  }
  if (plain) parts.push({ text: plain })
  return parts
}
