import test from 'node:test'
import assert from 'node:assert/strict'
import { splitSentences } from '../src/lib/sentenceSplit.ts'
import {
  newSentence,
  reordered,
  isMaterialSnapshot,
  RECOVERY_KEY
} from '../src/lib/materials.ts'
import { writeMaterials } from '../src/lib/materialStorage.ts'
import { editorWords } from '../src/lib/editorVocabulary.ts'
import { mergeToken } from '../src/lib/reading.ts'
const sentence = () => ({ ...newSentence('Un texte.'), id: 's1' })
const snapshot = () => ({
  version: 1,
  data: [
    {
      id: 'w',
      title: 'Livre',
      sourceLanguage: 'fr',
      sections: [{ id: 'c', title: 'Chapitre', sentences: [sentence()] }]
    }
  ],
  dict: {}
})
test('既存教材と空のライブラリ・章を受け入れ、ID重複は拒否する', () => {
  const s = snapshot()
  assert.ok(isMaterialSnapshot(s))
  assert.ok(isMaterialSnapshot({ version: 1, data: [], dict: {} }))
  s.data[0].author = 'Auteur'
  s.data[0].sections[0].sentences = []
  assert.ok(isMaterialSnapshot(s))
  s.data.push(s.data[0])
  assert.equal(isMaterialSnapshot(s), false)
})
test('並び替えでは内容・ID・元配列を変更しない', () => {
  const a = [{ id: 'a' }, { id: 'b' }]
  assert.deepEqual(reordered(a, 0, 1), [a[1], a[0]])
  assert.equal(a[0].id, 'a')
  assert.deepEqual(reordered(a, 0, -1), a)
})
test('略語・小数・会話・省略記号・改段落を保守的に分割する', () => {
  assert.deepEqual(splitSentences('M. Leblanc est ici. Il part.'), [
    'M. Leblanc est ici.',
    'Il part.'
  ])
  assert.deepEqual(splitSentences('Dr. Smith has 3.14 euros. He leaves!'), [
    'Dr. Smith has 3.14 euros.',
    'He leaves!'
  ])
  assert.deepEqual(splitSentences('« Bonjour ! » dit-il. Il part.'), [
    '« Bonjour ! » dit-il.',
    'Il part.'
  ])
  assert.deepEqual(splitSentences('Il hésite… puis répond.\n\nIl part.'), [
    'Il hésite… puis répond.',
    'Il part.'
  ])
  assert.deepEqual(splitSentences('Er liest z. B. ein Buch. Dann geht er.'), [
    'Er liest z. B. ein Buch.',
    'Dann geht er.'
  ])
  assert.deepEqual(splitSentences('学而時習之。別の文。'), [
    '学而時習之。',
    '別の文。'
  ])
})
test('原文の未登録語も選択でき、複数語・空白・句読点はそのまま保持する', () => {
  const source = 'Il prend soin de ses livres.'
  const dict = {
    'fr::prend soin de': {
      sourceLanguage: 'fr',
      token: 'prend soin de',
      ja: '大切にする',
      en: 'takes care of',
      origin: '',
      gender: '',
      grammarRefs: []
    }
  }
  const p = editorWords(source, 'fr', [], dict)
  assert.equal(p.map((x) => x.text).join(''), source)
  assert.ok(p.find((p) => p.text === 'prend soin de')?.word)
  assert.ok(p.find((p) => p.text === 'livres')?.word)
})
test('辞書形は明示したときだけ参照し、活用形の意味を捏造しない', () => {
  const dict = {
    'fr::être': {
      sourceLanguage: 'fr',
      token: 'être',
      en: 'be',
      ja: 'である',
      origin: '',
      gender: '',
      grammarRefs: [],
      partOfSpeech: '動詞'
    },
    'fr::est': {
      sourceLanguage: 'fr',
      token: 'est',
      en: '',
      ja: '',
      origin: '',
      gender: '',
      grammarRefs: [],
      lemma: 'être'
    }
  }
  assert.equal(mergeToken('fr', { text: 'est' }, dict).ja, 'である')
  assert.equal(mergeToken('fr', { text: 'suis' }, dict).ja, '')
  assert.equal(mergeToken('fr', { text: 'est' }, dict).partOfSpeech, '動詞')
})
function store(fail = () => false) {
  const map = new Map()
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      if (fail(k)) throw new Error('quota')
      map.set(k, v)
    },
    removeItem: (k) => map.delete(k)
  }
}
test('削除前に教材・辞書・下書き・進捗の保護コピーを作る', () => {
  const s = store(),
    old = snapshot(),
    next = { version: 1, data: [], dict: {} }
  s.setItem(
    'rsl-react-editor-drafts',
    JSON.stringify({ a: { editSource: '下書き' } })
  )
  s.setItem('rsl-react-progress', JSON.stringify({ read: ['s1'] }))
  writeMaterials(s, next, old, '削除', true)
  const r = JSON.parse(s.getItem(RECOVERY_KEY))
  assert.deepEqual(r.snapshot, old)
  assert.equal(r.drafts.a.editSource, '下書き')
  assert.equal(r.progress.read[0], 's1')
  assert.deepEqual(JSON.parse(s.getItem('rsl-react-data')), [])
})
test('保護コピーを作れない場合は削除を実行しない', () => {
  const s = store((k) => k === RECOVERY_KEY),
    old = snapshot()
  s.setItem('rsl-react-data', JSON.stringify(old.data))
  assert.throws(() =>
    writeMaterials(s, { version: 1, data: [], dict: {} }, old, '削除', true)
  )
  assert.deepEqual(JSON.parse(s.getItem('rsl-react-data')), old.data)
})
test('辞書書き込みの途中失敗では教材データも元に戻す', () => {
  let fail = false
  const s = store((k) => fail && k === 'rsl-react-dict'),
    old = snapshot()
  s.setItem('rsl-react-data', JSON.stringify(old.data))
  s.setItem('rsl-react-dict', '{}')
  fail = true
  assert.throws(() =>
    writeMaterials(s, { version: 1, data: [], dict: {} }, old, '削除', true)
  )
  assert.deepEqual(JSON.parse(s.getItem('rsl-react-data')), old.data)
  assert.ok(s.getItem(RECOVERY_KEY))
})

test('復元は下書き・進捗も戻し、復元前の状態を再び保護する', async () => {
  const { restoreMaterials } = await import('../src/lib/materialStorage.ts')
  const s = store(),
    old = snapshot(),
    current = { version: 1, data: [], dict: {} }
  s.setItem('rsl-react-data', '[]')
  s.setItem('rsl-react-dict', '{}')
  s.setItem(
    'rsl-react-editor-drafts',
    JSON.stringify({ current: '現在の入力' })
  )
  restoreMaterials(
    s,
    {
      createdAt: '',
      reason: '削除',
      snapshot: old,
      drafts: { before: '以前の入力' },
      progress: { read: ['s1'] }
    },
    current
  )
  assert.deepEqual(JSON.parse(s.getItem('rsl-react-data')), old.data)
  assert.equal(
    JSON.parse(s.getItem('rsl-react-editor-drafts')).before,
    '以前の入力'
  )
  assert.equal(JSON.parse(s.getItem(RECOVERY_KEY)).drafts.current, '現在の入力')
})
test('復元の途中で失敗しても、教材と下書きの組み合わせを元に戻す', async () => {
  const { restoreMaterials } = await import('../src/lib/materialStorage.ts')
  let fail = false
  const s = store((k) => fail && k === 'rsl-react-progress'),
    current = snapshot()
  s.setItem('rsl-react-data', JSON.stringify(current.data))
  s.setItem('rsl-react-dict', '{}')
  s.setItem(
    'rsl-react-editor-drafts',
    JSON.stringify({ current: '現在の入力' })
  )
  s.setItem('rsl-react-progress', '{}')
  fail = true
  assert.throws(() =>
    restoreMaterials(
      s,
      {
        createdAt: '',
        reason: '削除',
        snapshot: { version: 1, data: [], dict: {} },
        drafts: { before: '以前' },
        progress: { read: [] }
      },
      current
    )
  )
  assert.deepEqual(JSON.parse(s.getItem('rsl-react-data')), current.data)
  assert.equal(
    JSON.parse(s.getItem('rsl-react-editor-drafts')).current,
    '現在の入力'
  )
})
