import type { Work } from './models'

export const seedData: Work[] = [
  {
    id: 'lupin-preface',
    title: 'アルセーヌ・ルパン - Preface',
    sourceLanguage: 'フランス語',
    sections: [
      {
        id: 's1',
        title: '1 Le numero 514 - serie 23',
        description: '序章。作者評価とルパン像の導入。',
        sentences: [
          {
            id: 's1-1',
            label: 'Maurice Leblanc est un ecrivain trop meconnu.',
            source: 'Maurice Leblanc est un ecrivain trop meconnu.',
            english: 'Maurice Leblanc is a writer who is too unknown.',
            japanese: 'モーリス・ルブランは、あまりに知られていない作家だ。',
            tokens: [
              { text: 'Maurice', en: 'first name', ja: '名' },
              { text: 'Leblanc', en: 'surname', ja: '姓' },
              { text: 'est', en: 'is', ja: '〜である', grammarRefs: ['g-etre-present'] },
              { text: 'un', en: 'a', ja: '不定冠詞', gender: 'm', grammarRefs: ['g-article-gender'] },
              { text: 'ecrivain', en: 'writer', ja: '作家', gender: 'm', grammarRefs: ['g-article-gender'] },
              { text: 'trop', en: 'too', ja: 'あまりに', grammarRefs: ['g-adverb'] },
              { text: 'meconnu', en: 'little-known', ja: '知られていない', gender: 'm' }
            ],
            buildUp: [
              'Maurice Leblanc est un ecrivain.',
              'Maurice Leblanc est un ecrivain meconnu.',
              'Maurice Leblanc est un ecrivain trop meconnu.'
            ],
            notes: ['SVC 型', 'trop は強調'],
            grammar: [
              { id: 'g-etre-present', type: 'conjugation', title: 'etre 現在', body: 'est は3人称単数。' },
              { id: 'g-article-gender', type: 'grammar', title: '冠詞と性一致', body: 'un は男性名詞。' },
              { id: 'g-adverb', type: 'grammar', title: '副詞 trop', body: '過剰の程度を示す。' }
            ]
          },
          {
            id: 's1-2',
            label: 'Arsene Lupin est un personnage tres encombrant.',
            source: 'Arsene Lupin est un personnage tres encombrant.',
            english: 'Arsene Lupin is a very cumbersome character.',
            japanese: 'アルセーヌ・ルパンはとても厄介な人物だ。',
            tokens: [
              { text: 'Arsene', en: 'first name', ja: '名' },
              { text: 'Lupin', en: 'surname', ja: '姓' },
              { text: 'un', en: 'a', ja: '不定冠詞', gender: 'm' },
              { text: 'personnage', en: 'character', ja: '人物', gender: 'm' }
            ],
            buildUp: [
              'Arsene Lupin est un personnage.',
              'Arsene Lupin est un personnage encombrant.',
              'Arsene Lupin est un personnage tres encombrant.'
            ],
            notes: ['形容詞位置に注意'],
            grammar: [
              { id: 'g-adjective-position', type: 'pattern', title: '形容詞位置', body: '多くは名詞後置。' }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'karamazov-ru',
    title: 'カラマーゾフの兄弟',
    sourceLanguage: 'ロシア語',
    sections: [
      {
        id: 'ch1',
        title: '第1章',
        description: '人物紹介と語り口の導入。',
        sentences: [
          {
            id: 'k1-1',
            label: 'Он вдруг рассмеялся.',
            source: 'Он вдруг рассмеялся.',
            english: 'He suddenly burst into laughter.',
            japanese: '彼は不意に笑い始めた。',
            tokens: [
              { text: 'Он', en: 'he', ja: '彼' },
              { text: 'вдруг', en: 'suddenly', ja: '突然' },
              { text: 'рассмеялся', en: 'burst into laughter', ja: '笑い出した' }
            ],
            buildUp: ['Он смеялся.', 'Он рассмеялся.', 'Он вдруг рассмеялся.'],
            notes: ['副詞を外して骨格把握'],
            grammar: [{ id: 'g-aspect', type: 'grammar', title: '完了体', body: '動作の立ち上がりを示す。' }]
          }
        ]
      }
    ]
  }
]
