import test from 'node:test'
import assert from 'node:assert/strict'
import { createCloudPayload } from '../src/lib/cloudPayload.ts'
const sample = () => ({
  version: 1,
  data: [
    {
      id: 'work-id',
      title: '本',
      author: '著者',
      sourceLanguage: 'フランス語',
      sections: [
        {
          id: 'sec-id',
          title: '章',
          description: '解説',
          sentences: [
            {
              id: 'sentence-id',
              label: '文',
              source: 'Il est ici.',
              english: 'He is here.',
              japanese: '彼はここにいる。',
              tokens: [
                {
                  text: 'est',
                  ja: 'である',
                  en: 'is',
                  gender: '',
                  grammarRefs: ['g-etre'],
                  lemma: 'être',
                  partOfSpeech: '動詞'
                }
              ],
              buildUp: ['Il est.', 'Il est ici.'],
              notes: ['教材の備考'],
              grammar: [
                {
                  id: 'g-etre',
                  title: 'être',
                  body: '文法解説',
                  type: 'conjugation',
                  tags: ['動詞'],
                  tableRows: [
                    ['人称', '活用'],
                    ['3', 'est']
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  dict: {
    'フランス語::est': {
      sourceLanguage: 'フランス語',
      token: 'est',
      ja: 'である',
      en: 'is',
      origin: '語源',
      gender: '',
      grammarRefs: ['g-etre'],
      lemma: 'être',
      partOfSpeech: '動詞'
    }
  }
})
test('クラウドへの送信項目を全階層で許可リスト化し、学習状態と認証情報を除く', () => {
  const input = sample(),
    clean = sample()
  const secret = {
    progress: { read: ['secret'] },
    drafts: { text: 'secret' },
    auth: { access_token: 'secret' },
    access_token: 'secret',
    refresh_token: 'secret',
    password: 'secret',
    weak: true,
    readSet: ['secret']
  }
  Object.assign(input, secret)
  const w = input.data[0],
    s = w.sections[0],
    x = s.sentences[0]
  for (const item of [
    w,
    s,
    x,
    x.tokens[0],
    x.grammar[0],
    input.dict['フランス語::est']
  ])
    Object.assign(item, secret)
  const before = structuredClone(input)
  const payload = createCloudPayload(input)
  assert.deepEqual(payload, clean)
  assert.deepEqual(input, before)
  assert.equal(JSON.stringify(payload).includes('secret'), false)
})
test('教材の訳・注釈・辞書形・順序・文字列IDは変更しない', () => {
  const input = sample()
  assert.deepEqual(createCloudPayload(input), input)
})
test('既知の教材項目にオブジェクトなどが混入した場合は送信しない', () => {
  for (const mutate of [
    (p) => {
      p.data[0].author = { access_token: 'secret' }
    },
    (p) => {
      p.data[0].sections[0].sentences[0].tokens[0].grammarRefs = [
        { password: 'secret' }
      ]
    },
    (p) => {
      p.data[0].sections[0].sentences[0].grammar[0].tableRows = [
        ['ok'],
        [{ draft: 'secret' }]
      ]
    },
    (p) => {
      p.dict['フランス語::est'].gender = 'invalid'
    }
  ]) {
    const input = sample()
    mutate(input)
    assert.throws(() => createCloudPayload(input))
  }
})
test('optional項目がない旧教材・空のライブラリを安全に送信できる', () => {
  assert.deepEqual(createCloudPayload({ version: 1, data: [], dict: {} }), {
    version: 1,
    data: [],
    dict: {}
  })
  const p = sample()
  delete p.data[0].author
  delete p.data[0].sections[0].description
  delete p.data[0].sections[0].sentences[0].tokens[0].grammarRefs
  assert.deepEqual(createCloudPayload(p), p)
})
