import type { Token } from '../models'

export type QuickTranslationMode = 'off' | 'ja' | 'en' | 'both'

export function quickTranslationMode(value: unknown): QuickTranslationMode {
  return value === 'off' || value === 'en' || value === 'both' ? value : 'ja'
}

export function quickTranslationLines(
  token: Token,
  mode: QuickTranslationMode
) {
  const short = (value?: string) => {
    const characters = Array.from((value || '').trim().replace(/\s+/g, ' '))
    return characters.length > 100
      ? characters.slice(0, 100).join('') + '…'
      : characters.join('')
  }
  const lines: { language: 'ja' | 'en'; text: string; missing: boolean }[] = []
  if (mode === 'ja' || mode === 'both') {
    const text = short(token.ja)
    lines.push({
      language: 'ja',
      text: text || '日本語訳は未登録です',
      missing: !text
    })
  }
  if (mode === 'en' || mode === 'both') {
    const text = short(token.en)
    lines.push({
      language: 'en',
      text: text || '英語訳は未登録です',
      missing: !text
    })
  }
  return lines
}

export function quickTranslationPosition(
  anchor: { left: number; right: number; top: number; bottom: number },
  size: { width: number; height: number },
  viewport: { left: number; top: number; width: number; height: number }
) {
  const padding = 10
  const gap = 9
  const minLeft = viewport.left + padding
  const minTop = viewport.top + padding
  const maxLeft = Math.max(
    minLeft,
    viewport.left + viewport.width - size.width - padding
  )
  const maxTop = Math.max(
    minTop,
    viewport.top + viewport.height - size.height - padding
  )
  const above = anchor.top - gap - size.height
  const below = anchor.bottom + gap
  const placement =
    above >= minTop ||
    (below > maxTop &&
      anchor.top - minTop > viewport.top + viewport.height - anchor.bottom)
      ? 'top'
      : 'bottom'
  return {
    left: Math.min(
      maxLeft,
      Math.max(minLeft, (anchor.left + anchor.right - size.width) / 2)
    ),
    top: Math.min(
      maxTop,
      Math.max(minTop, placement === 'top' ? above : below)
    ),
    placement
  }
}
