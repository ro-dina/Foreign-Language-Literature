import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { DictEntry, GrammarItem, Sentence, Token, Work } from './models'
import { seedData } from './seedData'
import {
  getUserByAccessToken,
  hasSupabaseConfig,
  signInWithPassword,
  signOut,
  signUpWithPassword,
  type AuthUser
} from './lib/supabaseAuth'

const LS_DATA = 'rsl-react-data'
const LS_DICT = 'rsl-react-dict'
const LS_PROGRESS = 'rsl-react-progress'
const LS_UI = 'rsl-react-ui'
const LS_AUTH = 'rsl-react-auth'
const EDITOR_EMAILS = (import.meta.env.VITE_EDITOR_EMAILS as string | undefined)
  ?.split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean) || []

const dictKey = (language: string, token: string) => `${language}::${token}`
const sentenceKey = (w: string, s: string, x: string) => `${w}::${s}::${x}`

function normalizeGender(v?: string): '' | 'm' | 'f' | 'n' {
  const x = (v || '').toLowerCase().trim()
  return x === 'm' || x === 'f' || x === 'n' ? x : ''
}

function buildDictFromData(data: Work[]): Record<string, DictEntry> {
  const out: Record<string, DictEntry> = {}
  data.forEach((w) => {
    w.sections.forEach((s) => {
      s.sentences.forEach((x) => {
        x.tokens.forEach((t) => {
          const k = dictKey(w.sourceLanguage, t.text)
          if (!out[k]) {
            out[k] = {
              sourceLanguage: w.sourceLanguage,
              token: t.text,
              en: t.en || '',
              ja: t.ja || '',
              origin: t.origin || '',
              gender: normalizeGender(t.gender),
              grammarRefs: t.grammarRefs || []
            }
          }
        })
      })
    })
  })
  return out
}

function hydrateDictRecord(input: unknown): Record<string, DictEntry> {
  if (!input || typeof input !== 'object') return {}
  const out: Record<string, DictEntry> = {}
  Object.entries(input as Record<string, DictEntry>).forEach(([k, v]) => {
    if (!v || typeof v !== 'object') return
    out[k] = {
      sourceLanguage: v.sourceLanguage || '',
      token: v.token || '',
      en: v.en || '',
      ja: v.ja || '',
      origin: v.origin || '',
      gender: normalizeGender(v.gender),
      grammarRefs: Array.isArray(v.grammarRefs) ? v.grammarRefs.map(String) : []
    }
  })
  return out
}

function mergeDictWithData(data: Work[], dict: Record<string, DictEntry>) {
  const next = { ...dict }
  let changed = false
  data.forEach((w) => {
    w.sections.forEach((s) => {
      s.sentences.forEach((x) => {
        x.tokens.forEach((t) => {
          const key = dictKey(w.sourceLanguage, t.text)
          if (!next[key]) {
            changed = true
            next[key] = {
              sourceLanguage: w.sourceLanguage,
              token: t.text,
              en: t.en || '',
              ja: t.ja || '',
              origin: t.origin || '',
              gender: normalizeGender(t.gender),
              grammarRefs: t.grammarRefs || []
            }
          }
        })
      })
    })
  })
  return { next, changed }
}

function mergeToken(language: string, token: Token, dict: Record<string, DictEntry>) {
  const d = dict[dictKey(language, token.text)]
  return {
    text: token.text,
    en: token.en || d?.en || '',
    ja: token.ja || d?.ja || '',
    origin: token.origin || d?.origin || '',
    gender: normalizeGender(token.gender || d?.gender),
    grammarRefs: (token.grammarRefs && token.grammarRefs.length > 0 ? token.grammarRefs : d?.grammarRefs) || []
  }
}

function diffBuildStep(prev: string, cur: string) {
  const normalize = (x: string) => x.toLowerCase().replace(/[.,!?;:()[\]{}"']/g, '')
  const counts = new Map<string, number>()
  prev
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean)
    .forEach((k) => counts.set(k, (counts.get(k) || 0) + 1))

  return cur.split(/(\s+)/).map((part, idx) => {
    if (part.trim() === '') return <span key={idx}>{part}</span>
    const n = normalize(part)
    if (n && (counts.get(n) || 0) > 0) {
      counts.set(n, (counts.get(n) || 0) - 1)
      return <span key={idx}>{part}</span>
    }
    return (
      <span key={idx} className="build-added">
        {part}
      </span>
    )
  })
}

function toIdSeed(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
}

export default function App() {
  const [data, setData] = useState<Work[]>(() => {
    const raw = localStorage.getItem(LS_DATA)
    if (!raw) return seedData
    try {
      const parsed = JSON.parse(raw) as Work[]
      return parsed.length ? parsed : seedData
    } catch {
      return seedData
    }
  })
  const [dict, setDict] = useState<Record<string, DictEntry>>(() => {
    const raw = localStorage.getItem(LS_DICT)
    if (!raw) return buildDictFromData(seedData)
    try {
      const parsed = hydrateDictRecord(JSON.parse(raw))
      return Object.keys(parsed).length > 0 ? parsed : buildDictFromData(seedData)
    } catch {
      return buildDictFromData(seedData)
    }
  })

  const [workId, setWorkId] = useState(data[0]?.id || '')
  const [sectionId, setSectionId] = useState(data[0]?.sections[0]?.id || '')
  const [sentenceId, setSentenceId] = useState(data[0]?.sections[0]?.sentences[0]?.id || '')

  const [editMode, setEditMode] = useState(false)
  const [bookMode, setBookMode] = useState(false)
  const [hintsOn, setHintsOn] = useState(true)
  const [vocabOn, setVocabOn] = useState(true)
  const [genderOn, setGenderOn] = useState(false)
  const [paneWidth, setPaneWidth] = useState(280)

  const [readSet, setReadSet] = useState<Set<string>>(new Set())
  const [weakSet, setWeakSet] = useState<Set<string>>(new Set())

  const [query, setQuery] = useState('')

  const [quickSource, setQuickSource] = useState('')
  const [quickEnglish, setQuickEnglish] = useState('')
  const [quickJapanese, setQuickJapanese] = useState('')
  const [quickBuild, setQuickBuild] = useState('')
  const [quickNotes, setQuickNotes] = useState('')
  const [quickTokens, setQuickTokens] = useState('')
  const [editLabel, setEditLabel] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editEnglish, setEditEnglish] = useState('')
  const [editJapanese, setEditJapanese] = useState('')
  const [editBuild, setEditBuild] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [editTokens, setEditTokens] = useState('')
  const [vocabToken, setVocabToken] = useState('')
  const [vocabEnglish, setVocabEnglish] = useState('')
  const [vocabJapanese, setVocabJapanese] = useState('')
  const [vocabOrigin, setVocabOrigin] = useState('')
  const [vocabGender, setVocabGender] = useState<'' | 'm' | 'f' | 'n'>('')
  const [vocabGrammarRefs, setVocabGrammarRefs] = useState('')
  const [grammarId, setGrammarId] = useState('')
  const [grammarType, setGrammarType] = useState<'grammar' | 'conjugation' | 'pattern' | 'idiom'>('grammar')
  const [grammarTitle, setGrammarTitle] = useState('')
  const [grammarBody, setGrammarBody] = useState('')
  const [grammarTags, setGrammarTags] = useState('')
  const [grammarTableRows, setGrammarTableRows] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authReady, setAuthReady] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem(LS_PROGRESS)
    if (!raw) return
    try {
      const p = JSON.parse(raw) as { read: string[]; weak: string[] }
      setReadSet(new Set(p.read || []))
      setWeakSet(new Set(p.weak || []))
    } catch {
      // ignore
    }

    const uiRaw = localStorage.getItem(LS_UI)
    if (!uiRaw) return
    try {
      const ui = JSON.parse(uiRaw) as { paneWidth?: number; editMode?: boolean }
      if (ui.paneWidth) setPaneWidth(ui.paneWidth)
      if (typeof ui.editMode === 'boolean') setEditMode(ui.editMode)
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    if (!hasSupabaseConfig()) {
      setAuthMessage('Supabase未設定（VITE_SUPABASE_URL / ANON_KEY）')
      setAuthReady(true)
      return
    }
    const raw = localStorage.getItem(LS_AUTH)
    if (!raw) {
      setAuthReady(true)
      return
    }
    ;(async () => {
      try {
        const parsed = JSON.parse(raw) as { accessToken?: string }
        if (!parsed.accessToken) {
          setAuthReady(true)
          return
        }
        const user = await getUserByAccessToken(parsed.accessToken)
        setAccessToken(parsed.accessToken)
        setAuthUser(user)
      } catch {
        localStorage.removeItem(LS_AUTH)
      } finally {
        setAuthReady(true)
      }
    })()
  }, [])

  useEffect(() => {
    localStorage.setItem(LS_DATA, JSON.stringify(data))
  }, [data])

  useEffect(() => {
    localStorage.setItem(LS_DICT, JSON.stringify(dict))
  }, [dict])

  useEffect(() => {
    localStorage.setItem(LS_PROGRESS, JSON.stringify({ read: Array.from(readSet), weak: Array.from(weakSet) }))
  }, [readSet, weakSet])

  useEffect(() => {
    localStorage.setItem(LS_UI, JSON.stringify({ paneWidth, editMode }))
  }, [paneWidth, editMode])

  useEffect(() => {
    if (!authUser && editMode) {
      setEditMode(false)
    }
  }, [authUser, editMode])

  useEffect(() => {
    if (!accessToken) {
      localStorage.removeItem(LS_AUTH)
      return
    }
    localStorage.setItem(LS_AUTH, JSON.stringify({ accessToken }))
  }, [accessToken])

  useEffect(() => {
    const merged = mergeDictWithData(data, dict)
    if (merged.changed) {
      setDict(merged.next)
    }
  }, [data, dict])

  const work = useMemo(() => data.find((w) => w.id === workId) || data[0], [data, workId])
  const section = useMemo(() => work?.sections.find((s) => s.id === sectionId) || work?.sections[0], [work, sectionId])
  const sentence = useMemo(
    () => section?.sentences.find((x) => x.id === sentenceId) || section?.sentences[0],
    [section, sentenceId]
  )

  useEffect(() => {
    if (!work) return
    if (!work.sections.some((s) => s.id === sectionId)) {
      setSectionId(work.sections[0]?.id || '')
    }
  }, [work, sectionId])

  useEffect(() => {
    if (!section) return
    if (!section.sentences.some((s) => s.id === sentenceId)) {
      setSentenceId(section.sentences[0]?.id || '')
    }
  }, [section, sentenceId])

  useEffect(() => {
    if (!sentence) return
    setEditLabel(sentence.label || '')
    setEditSource(sentence.source || '')
    setEditEnglish(sentence.english || '')
    setEditJapanese(sentence.japanese || '')
    setEditBuild((sentence.buildUp || []).join('\n'))
    setEditNotes((sentence.notes || []).join('\n'))
    setEditTokens((sentence.tokens || []).map((t) => t.text).join(' | '))
    setGrammarId('')
    setGrammarType('grammar')
    setGrammarTitle('')
    setGrammarBody('')
    setGrammarTags('')
    setGrammarTableRows('')
  }, [sentence])

  const mergedTokens = useMemo(() => {
    if (!work || !sentence) return []
    return sentence.tokens.map((t) => mergeToken(work.sourceLanguage, t, dict))
  }, [work, sentence, dict])

  const languageVocabEntries = useMemo(() => {
    if (!work) return []
    return Object.values(dict)
      .filter((d) => d.sourceLanguage === work.sourceLanguage)
      .sort((a, b) => a.token.localeCompare(b.token))
  }, [dict, work])

  const readCount = useMemo(() => {
    if (!work || !section) return 0
    return section.sentences.filter((s) => readSet.has(sentenceKey(work.id, section.id, s.id))).length
  }, [readSet, work, section])

  const sentencePointers = useMemo(() => {
    const p: Array<{ w: string; s: string; x: string }> = []
    data.forEach((w) => w.sections.forEach((s) => s.sentences.forEach((x) => p.push({ w: w.id, s: s.id, x: x.id }))))
    return p
  }, [data])

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Array<{ w: Work; s: Work['sections'][number]; x: Sentence }> = []
    data.forEach((w) => {
      w.sections.forEach((s) => {
        s.sentences.forEach((x) => {
          const hay = [w.title, s.title, x.label, x.source, x.english, x.japanese, ...(x.notes || [])].join(' ').toLowerCase()
          if (hay.includes(q)) out.push({ w, s, x })
        })
      })
    })
    return out
  }, [data, query])

  const moveSentence = (offset: number) => {
    if (!work || !section || !sentence) return
    const idx = sentencePointers.findIndex((p) => p.w === work.id && p.s === section.id && p.x === sentence.id)
    if (idx < 0) return
    const next = sentencePointers[idx + offset]
    if (!next) return
    setWorkId(next.w)
    setSectionId(next.s)
    setSentenceId(next.x)
  }

  const toggleRead = () => {
    if (!work || !section || !sentence) return
    const key = sentenceKey(work.id, section.id, sentence.id)
    const next = new Set(readSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setReadSet(next)
  }

  const toggleWeak = (token: string) => {
    if (!work) return
    const key = dictKey(work.sourceLanguage, token)
    const next = new Set(weakSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setWeakSet(next)
  }

  const jumpToGrammar = (id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    const panel = document.getElementById('grammar-panel')
    if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const addSentence = () => {
    if (!work || !section || !quickSource.trim()) return
    if (!authUser) return
    const src = quickSource.trim()
    const base = toIdSeed(src) || 'sentence'
    let id = `${section.id}-${base}`
    let n = 2
    while (section.sentences.some((x) => x.id === id)) {
      id = `${section.id}-${base}-${n}`
      n += 1
    }
    const tokens = (quickTokens.trim() ? quickTokens : src)
      .split(quickTokens.trim() ? '|' : /\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }))

    const newSentence: Sentence = {
      id,
      label: src.length > 70 ? `${src.slice(0, 70)}...` : src,
      source: src,
      english: quickEnglish.trim(),
      japanese: quickJapanese.trim(),
      tokens,
      buildUp: quickBuild.trim() ? quickBuild.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : [src],
      notes: quickNotes.trim() ? quickNotes.split(/\r?\n/).map((x) => x.trim()).filter(Boolean) : [],
      grammar: []
    }

    setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id ? s : { ...s, sentences: [...s.sentences, newSentence] }
              )
            }
      )
    )
    setSentenceId(id)
    setQuickSource('')
    setQuickEnglish('')
    setQuickJapanese('')
    setQuickBuild('')
    setQuickNotes('')
    setQuickTokens('')
  }

  const deleteSentence = () => {
    if (!work || !section || !sentence) return
    if (!authUser) return
    if (section.sentences.length <= 1) return
    if (!window.confirm(`文を削除しますか？\n${sentence.label}`)) return

    const idx = section.sentences.findIndex((x) => x.id === sentence.id)
    const nextId = section.sentences[Math.max(0, idx - 1)].id
    setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id ? s : { ...s, sentences: s.sentences.filter((x) => x.id !== sentence.id) }
              )
            }
      )
    )
    setSentenceId(nextId)
  }

  const saveSentenceEdits = () => {
    if (!work || !section || !sentence) return
    if (!authUser) return
    if (!window.confirm('本文編集を保存しますか？')) return
    const nextSource = editSource.trim()
    if (!nextSource) {
      window.alert('本文は必須です')
      return
    }
    const tokens = (editTokens.trim() ? editTokens : nextSource)
      .split(editTokens.trim() ? '|' : /\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => ({ text }))
    const nextLabel = editLabel.trim() || (nextSource.length > 70 ? `${nextSource.slice(0, 70)}...` : nextSource)
    setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id
                  ? s
                  : {
                      ...s,
                      sentences: s.sentences.map((x) =>
                        x.id !== sentence.id
                          ? x
                          : {
                              ...x,
                              label: nextLabel,
                              source: nextSource,
                              english: editEnglish.trim(),
                              japanese: editJapanese.trim(),
                              tokens,
                              buildUp: editBuild
                                .split(/\r?\n/)
                                .map((v) => v.trim())
                                .filter(Boolean),
                              notes: editNotes
                                .split(/\r?\n/)
                                .map((v) => v.trim())
                                .filter(Boolean)
                            }
                      )
                    }
              )
            }
      )
    )
  }

  const clearVocabForm = () => {
    setVocabToken('')
    setVocabEnglish('')
    setVocabJapanese('')
    setVocabOrigin('')
    setVocabGender('')
    setVocabGrammarRefs('')
  }

  const saveVocabEntry = () => {
    if (!work) return
    if (!authUser) return
    const token = vocabToken.trim()
    if (!token) {
      window.alert('単語は必須です')
      return
    }
    if (!window.confirm(`単語「${token}」を保存しますか？`)) return
    const key = dictKey(work.sourceLanguage, token)
    setDict((prev) => ({
      ...prev,
      [key]: {
        sourceLanguage: work.sourceLanguage,
        token,
        en: vocabEnglish.trim(),
        ja: vocabJapanese.trim(),
        origin: vocabOrigin.trim(),
        gender: normalizeGender(vocabGender),
        grammarRefs: vocabGrammarRefs
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      }
    }))
  }

  const loadVocabEntry = (entry: DictEntry) => {
    setVocabToken(entry.token)
    setVocabEnglish(entry.en)
    setVocabJapanese(entry.ja)
    setVocabOrigin(entry.origin)
    setVocabGender(normalizeGender(entry.gender))
    setVocabGrammarRefs((entry.grammarRefs || []).join(', '))
  }

  const deleteVocabEntry = (token: string) => {
    if (!work) return
    if (!authUser) return
    if (!window.confirm(`単語「${token}」を削除しますか？`)) return
    const key = dictKey(work.sourceLanguage, token)
    setDict((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    if (vocabToken.trim() === token) {
      clearVocabForm()
    }
  }

  const clearGrammarForm = () => {
    setGrammarId('')
    setGrammarType('grammar')
    setGrammarTitle('')
    setGrammarBody('')
    setGrammarTags('')
    setGrammarTableRows('')
  }

  const loadGrammarItem = (item: GrammarItem) => {
    setGrammarId(item.id)
    setGrammarType(item.type || 'grammar')
    setGrammarTitle(item.title || '')
    setGrammarBody(item.body || '')
    setGrammarTags((item.tags || []).join(', '))
    setGrammarTableRows((item.tableRows || []).map((r) => r.join(' | ')).join('\n'))
  }

  const saveGrammarItem = () => {
    if (!work || !section || !sentence) return
    if (!authUser) return
    const title = grammarTitle.trim()
    if (!title) {
      window.alert('文法タイトルは必須です')
      return
    }
    const idSeed = grammarId.trim() || `g-${toIdSeed(title) || 'grammar'}`
    if (!window.confirm(`文法項目「${idSeed}」を保存しますか？`)) return
    const item: GrammarItem = {
      id: idSeed,
      type: grammarType,
      title,
      body: grammarBody.trim(),
      tags: grammarTags
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
      tableRows: grammarTableRows
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line
            .split('|')
            .map((cell) => cell.trim())
            .filter(Boolean)
        )
    }

    setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id
                  ? s
                  : {
                      ...s,
                      sentences: s.sentences.map((x) =>
                        x.id !== sentence.id
                          ? x
                          : {
                              ...x,
                              grammar: x.grammar.some((g) => g.id === idSeed)
                                ? x.grammar.map((g) => (g.id === idSeed ? item : g))
                                : [...x.grammar, item]
                            }
                      )
                    }
              )
            }
      )
    )
    setGrammarId(idSeed)
  }

  const deleteGrammarItem = (id: string) => {
    if (!work || !section || !sentence) return
    if (!authUser) return
    if (!window.confirm(`文法項目「${id}」を削除しますか？`)) return
    setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id
                  ? s
                  : {
                      ...s,
                      sentences: s.sentences.map((x) =>
                        x.id !== sentence.id ? x : { ...x, grammar: x.grammar.filter((g) => g.id !== id) }
                      )
                    }
              )
            }
      )
    )
    if (grammarId === id) {
      clearGrammarForm()
    }
  }

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setAuthMessage('メールとパスワードを入力してください')
      return
    }
    setAuthBusy(true)
    setAuthMessage('')
    try {
      const result = await signInWithPassword(email.trim(), password)
      setAccessToken(result.accessToken)
      setAuthUser(result.user)
      setAuthMessage(`ログイン: ${result.user.email}`)
    } catch (e) {
      setAuthMessage(`ログイン失敗: ${String(e)}`)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSignUp = async () => {
    if (!email.trim() || !password) {
      setAuthMessage('メールとパスワードを入力してください')
      return
    }
    setAuthBusy(true)
    setAuthMessage('')
    try {
      const result = await signUpWithPassword(email.trim(), password, window.location.origin)
      if (result.accessToken) {
        setAccessToken(result.accessToken)
      }
      if (result.user.id) {
        setAuthUser(result.user)
      }
      setAuthMessage('サインアップ成功。確認メール設定の場合はメール認証してください。')
    } catch (e) {
      setAuthMessage(`サインアップ失敗: ${String(e)}`)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleSignOut = async () => {
    setAuthBusy(true)
    try {
      if (accessToken) {
        await signOut(accessToken)
      }
    } catch {
      // ignore signout API errors
    } finally {
      setAccessToken('')
      setAuthUser(null)
      setEditMode(false)
      setAuthBusy(false)
      setAuthMessage('ログアウトしました')
    }
  }

  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setPaneWidth(Math.max(220, Math.min(560, e.clientX - 16)))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  if (!work || !section || !sentence) return <div className="empty">データがありません</div>

  const canEdit = Boolean(authUser && (EDITOR_EMAILS.length === 0 || EDITOR_EMAILS.includes((authUser.email || '').toLowerCase())))
  const currentRead = readSet.has(sentenceKey(work.id, section.id, sentence.id))

  return (
    <div className={`app ${editMode ? 'edit-mode' : ''}`} style={{ ['--left-pane-width' as string]: `${paneWidth}px` }}>
      <header className="topbar">
        <div>
          <h1>Reading Studio (React)</h1>
          <p>閲覧と編集を分離した語学ノート</p>
        </div>
        <div className="topbar-actions">
          <button
            onClick={() => {
              if (!canEdit) {
                setAuthMessage('編集するにはログインしてください')
                return
              }
              setEditMode((v) => !v)
            }}
          >
            編集モード: {editMode && canEdit ? 'ON' : 'OFF'}
          </button>
          <button onClick={() => setBookMode((v) => !v)}>表示: {bookMode ? 'Book' : 'Studio'}</button>
        </div>
      </header>

      <main className="layout">
        <aside className="panel side">
          <h2>アカウント</h2>
          {!authReady ? (
            <p className="muted">認証情報を確認中...</p>
          ) : authUser ? (
            <div className="auth-block">
              <p className="muted">ログイン中: {authUser.email || authUser.id}</p>
              <p className="muted">編集権限: {canEdit ? 'あり' : 'なし'}</p>
              <button onClick={handleSignOut} disabled={authBusy}>
                ログアウト
              </button>
            </div>
          ) : (
            <div className="auth-block">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email"
                autoComplete="username"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                autoComplete="current-password"
              />
              <div className="row-actions">
                <button onClick={handleSignIn} disabled={authBusy}>
                  ログイン
                </button>
                <button onClick={handleSignUp} disabled={authBusy}>
                  サインアップ
                </button>
              </div>
            </div>
          )}
          {authMessage && <p className="muted">{authMessage}</p>}

          <h2>作品</h2>
          <select
            value={work.id}
            onChange={(e) => {
              const w = data.find((x) => x.id === e.target.value)
              if (!w) return
              setWorkId(w.id)
              setSectionId(w.sections[0]?.id || '')
              setSentenceId(w.sections[0]?.sentences[0]?.id || '')
            }}
          >
            {data.map((w) => (
              <option key={w.id} value={w.id}>
                {w.title}
              </option>
            ))}
          </select>

          <h2>章</h2>
          <select
            value={section.id}
            onChange={(e) => {
              const s = work.sections.find((x) => x.id === e.target.value)
              if (!s) return
              setSectionId(s.id)
              setSentenceId(s.sentences[0]?.id || '')
            }}
          >
            {work.sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          <h2>検索（作品横断）</h2>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="本文・訳・備考で検索" />
          <ol className="sentence-list search-results">
            {searchHits.slice(0, 120).map((h) => (
              <li
                key={h.x.id + h.s.id + h.w.id}
                onClick={() => {
                  setWorkId(h.w.id)
                  setSectionId(h.s.id)
                  setSentenceId(h.x.id)
                }}
              >
                [{h.w.title} / {h.s.title}] {h.x.label}
              </li>
            ))}
          </ol>

          <h2>文</h2>
          <ol className="sentence-list">
            {section.sentences.map((x) => {
              const isRead = readSet.has(sentenceKey(work.id, section.id, x.id))
              return (
                <li
                  key={x.id}
                  className={`${x.id === sentence.id ? 'active' : ''} ${isRead ? 'read' : ''}`.trim()}
                  onClick={() => setSentenceId(x.id)}
                >
                  {isRead ? '✓ ' : ''}
                  {x.label}
                </li>
              )
            })}
          </ol>

          {editMode && canEdit && (
            <div className="edit-block">
              <h2>かんたん投稿</h2>
              <textarea rows={3} value={quickSource} onChange={(e) => setQuickSource(e.target.value)} placeholder="本文" />
              <textarea rows={2} value={quickEnglish} onChange={(e) => setQuickEnglish(e.target.value)} placeholder="英語" />
              <textarea rows={2} value={quickJapanese} onChange={(e) => setQuickJapanese(e.target.value)} placeholder="日本語" />
              <textarea rows={2} value={quickBuild} onChange={(e) => setQuickBuild(e.target.value)} placeholder="最小構成(1行=1)" />
              <textarea rows={2} value={quickNotes} onChange={(e) => setQuickNotes(e.target.value)} placeholder="備考(1行=1)" />
              <input value={quickTokens} onChange={(e) => setQuickTokens(e.target.value)} placeholder="tokens (|区切り)" />
              <button onClick={addSentence}>追加</button>
              <button onClick={deleteSentence}>現在文を削除</button>

              <h2>現在文を編集</h2>
              <input value={editLabel} onChange={(e) => setEditLabel(e.target.value)} placeholder="ラベル" />
              <textarea rows={3} value={editSource} onChange={(e) => setEditSource(e.target.value)} placeholder="本文" />
              <textarea rows={2} value={editEnglish} onChange={(e) => setEditEnglish(e.target.value)} placeholder="英語" />
              <textarea rows={2} value={editJapanese} onChange={(e) => setEditJapanese(e.target.value)} placeholder="日本語" />
              <textarea rows={2} value={editBuild} onChange={(e) => setEditBuild(e.target.value)} placeholder="最小構成(1行=1)" />
              <textarea rows={2} value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="備考(1行=1)" />
              <input value={editTokens} onChange={(e) => setEditTokens(e.target.value)} placeholder="tokens (|区切り)" />
              <button onClick={saveSentenceEdits}>本文編集を保存</button>

              <h2>単語辞書エディタ</h2>
              <input value={vocabToken} onChange={(e) => setVocabToken(e.target.value)} placeholder="単語" />
              <input value={vocabEnglish} onChange={(e) => setVocabEnglish(e.target.value)} placeholder="English" />
              <input value={vocabJapanese} onChange={(e) => setVocabJapanese(e.target.value)} placeholder="日本語" />
              <input value={vocabOrigin} onChange={(e) => setVocabOrigin(e.target.value)} placeholder="語源/メモ" />
              <select value={vocabGender} onChange={(e) => setVocabGender(normalizeGender(e.target.value))}>
                <option value="">性なし</option>
                <option value="m">m</option>
                <option value="f">f</option>
                <option value="n">n</option>
              </select>
              <input
                value={vocabGrammarRefs}
                onChange={(e) => setVocabGrammarRefs(e.target.value)}
                placeholder="文法参照ID (,区切り)"
              />
              <div className="row-actions">
                <button onClick={saveVocabEntry}>単語を保存</button>
                <button onClick={clearVocabForm}>入力クリア</button>
              </div>
              <ol className="sentence-list compact-list">
                {languageVocabEntries.map((entry) => (
                  <li key={entry.token}>
                    <span onClick={() => loadVocabEntry(entry)}>
                      {entry.token} | {entry.en || '-'} | {entry.ja || '-'}
                    </span>
                    <button className="inline-danger" onClick={() => deleteVocabEntry(entry.token)}>
                      削除
                    </button>
                  </li>
                ))}
              </ol>

              <h2>文法エディタ</h2>
              <input value={grammarId} onChange={(e) => setGrammarId(e.target.value)} placeholder="id (未入力で自動)" />
              <select value={grammarType} onChange={(e) => setGrammarType(e.target.value as 'grammar' | 'conjugation' | 'pattern' | 'idiom')}>
                <option value="grammar">grammar</option>
                <option value="conjugation">conjugation</option>
                <option value="pattern">pattern</option>
                <option value="idiom">idiom</option>
              </select>
              <input value={grammarTitle} onChange={(e) => setGrammarTitle(e.target.value)} placeholder="タイトル" />
              <textarea rows={3} value={grammarBody} onChange={(e) => setGrammarBody(e.target.value)} placeholder="説明" />
              <input value={grammarTags} onChange={(e) => setGrammarTags(e.target.value)} placeholder="タグ (,区切り)" />
              <textarea
                rows={3}
                value={grammarTableRows}
                onChange={(e) => setGrammarTableRows(e.target.value)}
                placeholder="表(1行=1レコード, 列は | 区切り)"
              />
              <div className="row-actions">
                <button onClick={saveGrammarItem}>文法を保存</button>
                <button onClick={clearGrammarForm}>入力クリア</button>
              </div>
              <ol className="sentence-list compact-list">
                {sentence.grammar.map((g) => (
                  <li key={g.id}>
                    <span onClick={() => loadGrammarItem(g)}>
                      {g.id} | {g.title}
                    </span>
                    <button className="inline-danger" onClick={() => deleteGrammarItem(g.id)}>
                      削除
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </aside>

        <div className="splitter" onMouseDown={() => setDragging(true)} />

        <section className="panel main">
          <div className="row">
            <h2>{sentence.label}</h2>
            <div className="row-actions">
              <button onClick={() => moveSentence(-1)}>前の文</button>
              <button onClick={() => moveSentence(1)}>次の文</button>
              <button onClick={toggleRead}>既読: {currentRead ? 'ON' : 'OFF'}</button>
              <button onClick={() => setHintsOn((v) => !v)}>語彙ヒント: {hintsOn ? 'ON' : 'OFF'}</button>
              <button onClick={() => setVocabOn((v) => !v)}>単語表: {vocabOn ? 'ON' : 'OFF'}</button>
              <button onClick={() => setGenderOn((v) => !v)}>性カラー: {genderOn ? 'ON' : 'OFF'}</button>
            </div>
          </div>

          <div className="card">
            <div className="row">
              <h3>章情報</h3>
            </div>
            <p>{section.description || '章解説は未入力です'}</p>
            <p className="muted">
              進捗: {readCount}/{section.sentences.length} 既読 / 苦手単語 {weakSet.size}
            </p>
          </div>

          {bookMode ? (
            <div className="card">
              <h3>Book View</h3>
              <ol className="book-list">
                {section.sentences.map((x) => (
                  <li key={x.id} className="book-item" onClick={() => setSentenceId(x.id)}>
                    <p className="source">{x.source}</p>
                    <p className="muted">{x.japanese}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : (
            <>
              <div className="card">
                <h3>本文（{work.sourceLanguage}）</h3>
                <p className="source">
                  {mergedTokens.map((t, i) => {
                    const weak = weakSet.has(dictKey(work.sourceLanguage, t.text))
                    return (
                      <span key={i} className={`token ${genderOn ? `gender-${t.gender || 'x'}` : ''} ${weak ? 'weak-token' : ''}`}>
                        {t.text}{' '}
                        {hintsOn && (
                          <span className="hint">
                            EN: {t.en || '-'} / JA: {t.ja || '-'}
                            {!!t.grammarRefs?.length && (
                              <>
                                <br />
                                G:{' '}
                                {t.grammarRefs.map((ref, refIdx) => (
                                  <button
                                    key={`${t.text}-${ref}`}
                                    className="link-btn"
                                    onClick={() => jumpToGrammar(ref)}
                                  >
                                    {ref}
                                    {refIdx < t.grammarRefs.length - 1 ? ',' : ''}
                                  </button>
                                ))}
                              </>
                            )}
                          </span>
                        )}
                      </span>
                    )
                  })}
                </p>
              </div>

              <div className="grid2">
                <div className="card">
                  <h3>英語</h3>
                  <p>{sentence.english}</p>
                </div>
                <div className="card">
                  <h3>日本語</h3>
                  <p>{sentence.japanese}</p>
                </div>
              </div>

              <div className="card">
                <h3>最小構成からの積み上げ</h3>
                <ol>
                  {sentence.buildUp.map((s, idx) => (
                    <li key={idx}>{idx === 0 ? s : diffBuildStep(sentence.buildUp[idx - 1], s)}</li>
                  ))}
                </ol>
              </div>

              <div className="card">
                <h3>備考</h3>
                <ul>
                  {sentence.notes.map((n, idx) => (
                    <li key={idx}>{n}</li>
                  ))}
                </ul>
              </div>

              <div className="card" id="grammar-panel">
                <h3>文法表</h3>
                {sentence.grammar.length === 0 ? (
                  <p className="muted">この文の文法項目は未登録です。</p>
                ) : (
                  <div className="grammar-list">
                    {sentence.grammar.map((g) => (
                      <div key={g.id} className="grammar-item" id={g.id}>
                        <p>
                          <strong>{g.title}</strong> <span className="muted">({g.id})</span>
                        </p>
                        {g.type && <p className="muted">type: {g.type}</p>}
                        {g.tags && g.tags.length > 0 && <p className="muted">tags: {g.tags.join(', ')}</p>}
                        {g.body && <p>{g.body}</p>}
                        {g.tableRows && g.tableRows.length > 0 && (
                          <table className="table">
                            <tbody>
                              {g.tableRows.map((row, rowIdx) => (
                                <tr key={`${g.id}-${rowIdx}`}>
                                  {row.map((cell, cellIdx) => (
                                    <td key={`${g.id}-${rowIdx}-${cellIdx}`}>{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {vocabOn && (
                <div className="card">
                  <h3>単語表</h3>
                  <table className="table">
                    <thead>
                      <tr>
                        <th>{work.sourceLanguage}</th>
                        <th>English</th>
                        <th>日本語</th>
                        <th>性</th>
                        <th>苦手</th>
                        <th>語源/メモ</th>
                        <th>文法参照</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(new Map(mergedTokens.map((t) => [t.text, t])).values()).map((t) => {
                        const weak = weakSet.has(dictKey(work.sourceLanguage, t.text))
                        return (
                          <tr key={t.text}>
                            <td className={genderOn ? `gender-${t.gender || 'x'}` : ''}>{t.text}</td>
                            <td>{t.en}</td>
                            <td>{t.ja}</td>
                            <td className={genderOn ? `gender-${t.gender || 'x'}` : ''}>{t.gender}</td>
                            <td>
                              <button className={`weak-token-btn ${weak ? 'on' : ''}`} onClick={() => toggleWeak(t.text)}>
                                {weak ? 'ON' : 'OFF'}
                              </button>
                            </td>
                            <td>{t.origin}</td>
                            <td>
                              {(t.grammarRefs || []).map((ref) => (
                                <button key={`${t.text}-${ref}`} className="link-btn" onClick={() => jumpToGrammar(ref)}>
                                  {ref}
                                </button>
                              ))}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
