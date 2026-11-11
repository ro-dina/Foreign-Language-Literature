import test from 'node:test'
import assert from 'node:assert/strict'
import { sourceParts, mergeToken } from '../src/lib/reading.ts'

test('原文・句読点・改行を、部分的な語彙情報でも欠落させない', () => {
  const source =
    'Arsene Lupin est un personnage tres encombrant.\nОн вдруг рассмеялся.'
  const parts = sourceParts(source, [
    { text: 'Lupin', ja: 'ルパン' },
    { text: 'personnage' },
    { text: 'Он' }
  ])
  assert.equal(parts.map((p) => p.text).join(''), source)
  assert.equal(parts.filter((p) => p.token).length, 3)
})
test('単語の途中を誤って注釈せず、長い語句を優先する', () => {
  const parts = sourceParts('un inconnu, Maurice Leblanc.', [
    { text: 'un' },
    { text: 'Maurice' },
    { text: 'Maurice Leblanc' }
  ])
  assert.deepEqual(
    parts.filter((p) => p.token).map((p) => p.text),
    ['un', 'Maurice Leblanc']
  )
})
test('スペースのない原文・空の単語一覧・繰り返す語を保持する', () => {
  assert.equal(
    sourceParts('学而時習之。', [{ text: '学' }, { text: '時習' }]).filter(
      (p) => p.token
    ).length,
    2
  )
  assert.equal(
    sourceParts('学而時習之。', [])
      .map((p) => p.text)
      .join(''),
    '学而時習之。'
  )
  assert.equal(
    sourceParts('est est.', [{ text: 'est' }]).filter((p) => p.token).length,
    2
  )
})
test('辞書編集を反映し、辞書にない語の固有注釈も保持する', () => {
  const token = { text: 'est', ja: '元の訳', grammarRefs: ['g-etre'] }
  const dict = {
    'fr::est': {
      sourceLanguage: 'fr',
      token: 'est',
      en: 'is',
      ja: 'である',
      origin: 'être',
      gender: '',
      grammarRefs: ['g-etre']
    }
  }
  assert.equal(mergeToken('fr', token, dict).ja, 'である')
  assert.deepEqual(mergeToken('ru', token, dict).grammarRefs, ['g-etre'])
  assert.deepEqual(token, {
    text: 'est',
    ja: '元の訳',
    grammarRefs: ['g-etre']
  })
})
