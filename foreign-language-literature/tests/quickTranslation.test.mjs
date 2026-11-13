import test from 'node:test'
import assert from 'node:assert/strict'
import {
  quickTranslationMode,
  quickTranslationLines,
  quickTranslationPosition
} from '../src/lib/quickTranslation.ts'

test('旧設定に項目がなくても日本語が初期値になり、OFFを保持する', () => {
  assert.equal(quickTranslationMode(undefined), 'ja')
  assert.equal(quickTranslationMode('invalid'), 'ja')
  for (const mode of ['ja', 'en', 'both', 'off'])
    assert.equal(quickTranslationMode(mode), mode)
})
test('設定した言語の登録済みの訳だけを表示し、日本語を先にする', () => {
  const token = {
    text: 'prendre soin de',
    ja: '〜を大切にする',
    en: 'to take care of',
    origin: '長い語源は表示しない',
    grammarRefs: ['g-idiom']
  }
  assert.deepEqual(quickTranslationLines(token, 'both'), [
    { language: 'ja', text: '〜を大切にする', missing: false },
    { language: 'en', text: 'to take care of', missing: false }
  ])
  assert.equal(quickTranslationLines(token, 'ja').length, 1)
  assert.equal(quickTranslationLines(token, 'en')[0].language, 'en')
  assert.deepEqual(quickTranslationLines(token, 'off'), [])
})
test('片方の訳・両方の訳が未登録でも意味を補完しない', () => {
  assert.deepEqual(quickTranslationLines({ text: 'était', en: 'was' }, 'ja'), [
    { language: 'ja', text: '日本語訳は未登録です', missing: true }
  ])
  assert.ok(
    quickTranslationLines({ text: 'inconnu' }, 'both').every(
      (line) => line.missing
    )
  )
})
test('長い訳は短く整え、元の教材データを変更しない', () => {
  const token = { text: 'livres', ja: '本\n  書物', en: 'a'.repeat(200) }
  assert.equal(quickTranslationLines(token, 'ja')[0].text, '本 書物')
  assert.equal(
    quickTranslationLines(token, 'en')[0].text,
    'a'.repeat(100) + '…'
  )
  assert.equal(token.ja, '本\n  書物')
  assert.equal(token.en.length, 200)
})
test('通常は単語の上、上端では下に置き、左右と下端にはみ出さない', () => {
  const viewport = { left: 0, top: 0, width: 390, height: 844 }
  const size = { width: 260, height: 110 }
  assert.equal(
    quickTranslationPosition(
      { left: 140, right: 190, top: 300, bottom: 330 },
      size,
      viewport
    ).placement,
    'top'
  )
  for (const anchor of [
    { left: 1, right: 70, top: 1, bottom: 31 },
    { left: 330, right: 389, top: 800, bottom: 843 }
  ]) {
    const result = quickTranslationPosition(anchor, size, viewport)
    assert.ok(result.left >= 10)
    assert.ok(result.left + size.width <= viewport.width - 10)
    assert.ok(result.top >= 10)
    assert.ok(result.top + size.height <= viewport.height - 10)
  }
  assert.equal(
    quickTranslationPosition(
      { left: 1, right: 70, top: 1, bottom: 31 },
      size,
      viewport
    ).placement,
    'bottom'
  )
})
test('拡大・ソフトキーボード表示時の視覚ビューポートのずれも考慮する', () => {
  const result = quickTranslationPosition(
    { left: 0, right: 50, top: 20, bottom: 50 },
    { width: 150, height: 100 },
    { left: 40, top: 100, width: 200, height: 300 }
  )
  assert.ok(result.left >= 50)
  assert.ok(result.top >= 110)
  assert.ok(result.left + 150 <= 230)
  assert.ok(result.top + 100 <= 390)
})
