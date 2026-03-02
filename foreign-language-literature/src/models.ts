export type GrammarType = 'grammar' | 'conjugation' | 'pattern' | 'idiom'

export type Token = {
  text: string
  en?: string
  ja?: string
  origin?: string
  gender?: '' | 'm' | 'f' | 'n'
  grammarRefs?: string[]
}

export type GrammarItem = {
  id: string
  type?: GrammarType
  tags?: string[]
  title: string
  body: string
  tableRows?: string[][]
}

export type Sentence = {
  id: string
  label: string
  source: string
  english: string
  japanese: string
  tokens: Token[]
  buildUp: string[]
  notes: string[]
  grammar: GrammarItem[]
}

export type Section = {
  id: string
  title: string
  description?: string
  sentences: Sentence[]
}

export type Work = {
  id: string
  title: string
  sourceLanguage: string
  sections: Section[]
}

export type DictEntry = {
  sourceLanguage: string
  token: string
  en: string
  ja: string
  origin: string
  gender: '' | 'm' | 'f' | 'n'
  grammarRefs: string[]
}
