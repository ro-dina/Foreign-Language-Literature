// Conservative suggestions only: users review, join and split before committing.
export function splitSentences(source: string): string[] {
  const text = source.replace(/\r\n?/g, '\n').trim()
  if (!text) return []
  const out: string[] = []
  let start = 0
  const abbreviations = new Set([
    'm',
    'mm',
    'mme',
    'mlle',
    'mr',
    'mrs',
    'ms',
    'dr',
    'prof',
    'sr',
    'jr',
    'st',
    'ste',
    'etc',
    'e.g',
    'i.e',
    'vs',
    'z.b',
    'z',
    'u',
    'd',
    'bzw',
    'usw',
    'u.a',
    'd.h',
    'nr',
    'bd',
    's',
    'hr',
    'fr',
    'bsp'
  ])
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n' && text[i + 1] === '\n') {
      const part = text.slice(start, i).trim()
      if (part) out.push(part)
      while (text[i + 1] === '\n') i++
      start = i + 1
      continue
    }
    if (!/[.!?。！？…]/u.test(text[i])) continue
    let end = i + 1
    while (end < text.length && /[.!?。！？…]/u.test(text[end])) end++
    const punct = text.slice(i, end)
    if (
      punct === '.' &&
      /\d/.test(text[i - 1] || '') &&
      /\d/.test(text[end] || '')
    )
      continue
    if (punct === '.') {
      const token = (text.slice(start, i).match(/([\p{L}.]+)$/u) || [])[1] || ''
      if (
        abbreviations.has(token.toLowerCase()) ||
        /^[A-ZÀ-ÖØ-Þ]$/u.test(token) ||
        /^(?:\p{L}\.)+\p{L}$/u.test(token)
      )
        continue
    }
    while (end < text.length && /[»”’"')\]]/u.test(text[end])) end++
    const closing = text.slice(end).match(/^[ \t]*[»”"’']+/u)?.[0]
    if (closing) end += closing.length
    if (
      (closing || /[»”"’']$/u.test(text.slice(i, end))) &&
      /^\s*(?:dit|demanda|répondit|murmura|said|asked|replied|sagte|fragte|antwortete)\b/iu.test(
        text.slice(end)
      )
    ) {
      i = end - 1
      continue
    }
    const next = text.slice(end).match(/^\s*([\s\S])/u)?.[1]
    if (punct === '…' || /^\.{2,}$/.test(punct)) {
      if (next && !/[\p{Lu}«“"—–]/u.test(next)) {
        i = end - 1
        continue
      }
    }
    if (
      end < text.length &&
      !/\s/u.test(text[end]) &&
      !/[。！？]/u.test(punct)
    ) {
      i = end - 1
      continue
    }
    const part = text.slice(start, end).trim()
    if (part) out.push(part)
    start = end
    i = end - 1
  }
  const rest = text.slice(start).trim()
  if (rest) out.push(rest)
  return out
}
