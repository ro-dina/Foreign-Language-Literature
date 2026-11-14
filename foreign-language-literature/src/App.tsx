import { useEffect, useMemo, useRef, useState } from 'react'
import { useEditorDraft, initialDraft } from './hooks/useEditorDraft'
import { dictKey, sentenceKey, mergeToken } from './lib/reading'
import { LibraryManager } from './components/LibraryManager'
import { CloudMaterials } from './components/CloudMaterials'
import type { BulkRequest } from './components/BulkImporter'
import {
  EMPTY_WORK,
  EMPTY_SECTION,
  EMPTY_SENTENCE,
  RECOVERY_KEY,
  isMaterialSnapshot,
  type MaterialSnapshot,
  type Recovery
} from './lib/materials'
import { writeMaterials, restoreMaterials } from './lib/materialStorage'
import { Library } from './components/Library'
import { Reader } from './components/Reader'
import { StudyPanel, type StudyTab } from './components/StudyPanel'
import { EditorPage, type EditorTab } from './components/EditorPage'
import { Dialog } from './components/Dialog'
import { useDrawerFocus } from './hooks/useDrawerFocus'
import {
  quickTranslationMode,
  type QuickTranslationMode
} from './lib/quickTranslation'
import './App.css'
import type { DictEntry, GrammarItem, Sentence, Work } from './models'
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
const EDITOR_EMAILS =
  (import.meta.env.VITE_EDITOR_EMAILS as string | undefined)
    ?.split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean) || []

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
              grammarRefs: t.grammarRefs || [],
              lemma: t.lemma || '',
              partOfSpeech: t.partOfSpeech || ''
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
      grammarRefs: Array.isArray(v.grammarRefs)
        ? v.grammarRefs.map(String)
        : [],
      lemma: v.lemma || '',
      partOfSpeech: v.partOfSpeech || ''
    }
  })
  return out
}

function toIdSeed(text: string) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
}

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback
  } catch {
    return fallback
  }
}
const savedUI = readLocal<{
  paneWidth?: number
  theme?: 'light' | 'dark'
  fontScale?: number
  bookShowSource?: boolean
  bookShowEnglish?: boolean
  bookShowJapanese?: boolean
  readMode?: 'reading' | 'study'
  bookMode?: boolean
  hintsOn?: boolean
  genderOn?: boolean
  comparison?: boolean
  quickTranslation?: QuickTranslationMode
}>(LS_UI, {})
const savedPosition = readLocal<{ w?: string; s?: string; x?: string }>(
  'rsl-react-position',
  {}
)

export default function App() {
  const [data, setDataState] = useState<Work[]>(() => {
    const raw = localStorage.getItem(LS_DATA)
    if (!raw) return seedData
    try {
      const parsed = JSON.parse(raw) as Work[]
      return Array.isArray(parsed) ? parsed : seedData
    } catch {
      return seedData
    }
  })
  const [dict, setDictState] = useState<Record<string, DictEntry>>(() => {
    const raw = localStorage.getItem(LS_DICT)
    if (!raw) return buildDictFromData(data)
    try {
      const parsed = hydrateDictRecord(JSON.parse(raw))
      return parsed
    } catch {
      return buildDictFromData(data)
    }
  })

  const [workId, setWorkId] = useState(savedPosition.w || data[0]?.id || '')
  const [sectionId, setSectionId] = useState(
    savedPosition.s || data[0]?.sections[0]?.id || ''
  )
  const [sentenceId, setSentenceId] = useState(
    savedPosition.x || data[0]?.sections[0]?.sentences[0]?.id || ''
  )

  const [pageMode, setPageMode] = useState<'read' | 'edit'>('read')
  const [bookMode, setBookMode] = useState(savedUI.bookMode ?? false)
  const [hintsOn, setHintsOn] = useState(savedUI.hintsOn ?? true)
  const [quickTranslation, setQuickTranslation] = useState(() =>
    quickTranslationMode(savedUI.quickTranslation)
  )
  const [genderOn, setGenderOn] = useState(savedUI.genderOn ?? false)
  const [paneWidth, setPaneWidth] = useState(
    Math.max(230, Math.min(savedUI.paneWidth || 260, 360))
  )
  const [theme, setTheme] = useState<'light' | 'dark'>(
    savedUI.theme ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light')
  )
  const [fontScale, setFontScale] = useState(
    Math.max(0.8, Math.min(savedUI.fontScale || 1, 1.6))
  )
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1100)
  const [bookShowSource, setBookShowSource] = useState(
    savedUI.bookShowSource ?? true
  )
  const [bookShowEnglish, setBookShowEnglish] = useState(
    savedUI.bookShowEnglish ?? false
  )
  const [bookShowJapanese, setBookShowJapanese] = useState(
    savedUI.bookShowJapanese ?? true
  )

  const [readSet, setReadSet] = useState<Set<string>>(
    () =>
      new Set(
        readLocal<{ read: string[] }>(LS_PROGRESS, { read: [] }).read || []
      )
  )
  const [weakSet, setWeakSet] = useState<Set<string>>(
    () =>
      new Set(
        readLocal<{ weak: string[] }>(LS_PROGRESS, { weak: [] }).weak || []
      )
  )

  const [query, setQuery] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [accessToken, setAccessToken] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [authReady, setAuthReady] = useState(false)

  const [readMode, setReadMode] = useState<'reading' | 'study'>(
    savedUI.readMode || 'study'
  )
  const [panelOpen, setPanelOpen] = useState(
    window.innerWidth >= 1100 && savedUI.readMode !== 'reading'
  )
  const [studyTab, setStudyTab] = useState<StudyTab>('translation')
  const [editorTab, setEditorTab] = useState<EditorTab>('source')
  const [focusGrammar, setFocusGrammar] = useState<string | null>(null)
  const [comparison, setComparison] = useState(savedUI.comparison ?? false)
  const [managerOpen, setManagerOpen] = useState(false)
  const [cloudOpen, setCloudOpen] = useState(false)
  const [editorEpoch, setEditorEpoch] = useState(0)
  const [accountOpen, setAccountOpen] = useState(false)
  const [editMessage, setEditMessage] = useState('')
  const [editError, setEditError] = useState('')
  const [storageError, setStorageError] = useState('')
  const readerScroll = useRef<HTMLDivElement>(null)
  const libraryRef = useRef<HTMLElement>(null)
  const studyRef = useRef<HTMLElement>(null)
  useDrawerFocus(libraryRef, sidebarOpen, () => setSidebarOpen(false))
  useDrawerFocus(studyRef, panelOpen && pageMode === 'read', () =>
    setPanelOpen(false)
  )
  const canEdit = Boolean(
    authUser &&
    (EDITOR_EMAILS.length === 0 ||
      EDITOR_EMAILS.includes(authUser.email.toLowerCase()))
  )

  const commitMaterials = (
    nextData: Work[],
    nextDict: Record<string, DictEntry>,
    reason: string,
    protect = false
  ) => {
    try {
      writeMaterials(
        localStorage,
        { version: 1, data: nextData, dict: nextDict },
        { version: 1, data, dict },
        reason,
        protect
      )
      setDataState(nextData)
      setDictState(nextDict)
      setStorageError('')
      return true
    } catch {
      setStorageError(
        '保存を中止しました。保存容量と保護コピーを確認し、バックアップを書き出してください。'
      )
      return false
    }
  }
  const setData = (update: Work[] | ((old: Work[]) => Work[])) =>
    commitMaterials(
      typeof update === 'function' ? update(data) : update,
      dict,
      '教材編集'
    )
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
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(data))
    } catch {
      setStorageError(
        '教材の保存に失敗しました。バックアップを書き出してください。'
      )
    }
  }, [data])

  useEffect(() => {
    try {
      localStorage.setItem(LS_DICT, JSON.stringify(dict))
    } catch {
      setStorageError(
        '辞書の保存に失敗しました。バックアップを書き出してください。'
      )
    }
  }, [dict])

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_PROGRESS,
        JSON.stringify({ read: Array.from(readSet), weak: Array.from(weakSet) })
      )
    } catch {
      setStorageError('学習進捗を保存できません。')
    }
  }, [readSet, weakSet])

  useEffect(() => {
    try {
      localStorage.setItem(
        LS_UI,
        JSON.stringify({
          paneWidth,
          pageMode,
          theme,
          fontScale,
          bookShowSource,
          bookShowEnglish,
          bookShowJapanese,
          readMode,
          bookMode,
          hintsOn,
          quickTranslation,
          genderOn,
          comparison
        })
      )
    } catch {
      setStorageError('表示設定を保存できません。')
    }
  }, [
    paneWidth,
    pageMode,
    theme,
    fontScale,
    bookShowSource,
    bookShowEnglish,
    bookShowJapanese,
    readMode,
    bookMode,
    hintsOn,
    quickTranslation,
    genderOn,
    comparison
  ])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.style.colorScheme = theme
  }, [theme])

  // 閲覧ページのキーボード操作: ←/→ で文移動、r で既読、b でブック表示
  useEffect(() => {
    if (pageMode !== 'read' || accountOpen || managerOpen || cloudOpen) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (
        el?.closest(
          'input,textarea,select,button,summary,[role=tablist],[contenteditable=true]'
        )
      )
        return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault()
        moveSentence(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault()
        moveSentence(-1)
      } else if (e.key === 'r') {
        toggleRead()
      } else if (e.key === 'b') {
        setBookMode((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // 文が変わったら固定中のヒントを解除
  useEffect(() => {
    setSelectedToken(null)
  }, [sentenceId])

  useEffect(() => {
    if (authReady && !canEdit && pageMode === 'edit') {
      setPageMode('read')
    }
  }, [authReady, canEdit, pageMode])

  useEffect(() => {
    if (!authReady) return
    if (!accessToken) {
      localStorage.removeItem(LS_AUTH)
      return
    }
    localStorage.setItem(LS_AUTH, JSON.stringify({ accessToken }))
  }, [accessToken, authReady])

  const work = useMemo(
    () => data.find((w) => w.id === workId) || data[0] || EMPTY_WORK,
    [data, workId]
  )
  const section = useMemo(
    () =>
      work?.sections.find((s) => s.id === sectionId) ||
      work?.sections[0] ||
      EMPTY_SECTION,
    [work, sectionId]
  )
  const sentence = useMemo(
    () =>
      section?.sentences.find((x) => x.id === sentenceId) ||
      section?.sentences[0] ||
      EMPTY_SENTENCE,
    [section, sentenceId]
  )

  useEffect(() => {
    if (!work.id) return
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

  const draftKey =
    work && section && sentence
      ? sentenceKey(work.id, section.id, sentence.id)
      : ''
  const editor = useEditorDraft(draftKey, sentence, editorEpoch)
  const {
    quickSource,
    quickEnglish,
    quickJapanese,
    quickBuild,
    quickNotes,
    quickTokens,
    quickInsertMode,
    editLabel,
    editSource,
    editEnglish,
    editJapanese,
    editBuild,
    editNotes,
    editTokens,
    vocabToken,
    vocabEnglish,
    vocabJapanese,
    vocabOrigin,
    vocabGender,
    vocabGrammarRefs,
    vocabLemma,
    vocabPartOfSpeech,
    grammarId,
    grammarType,
    grammarTitle,
    grammarBody,
    grammarTags,
    grammarTableRows
  } = editor.values
  const {
    setQuickSource,
    setQuickEnglish,
    setQuickJapanese,
    setQuickBuild,
    setQuickNotes,
    setQuickTokens,
    setVocabToken,
    setVocabEnglish,
    setVocabJapanese,
    setVocabOrigin,
    setVocabGender,
    setVocabGrammarRefs,
    setVocabLemma,
    setVocabPartOfSpeech,
    setGrammarId,
    setGrammarType,
    setGrammarTitle,
    setGrammarBody,
    setGrammarTags,
    setGrammarTableRows
  } = editor.setters

  const mergedTokens = useMemo(() => {
    if (!work || !sentence) return []
    return sentence.tokens.map((t) => mergeToken(work.sourceLanguage, t, dict))
  }, [work, sentence, dict])

  const languageVocabEntries = useMemo(() => {
    if (!work.id) return []
    return Object.values(dict)
      .filter((d) => d.sourceLanguage === work.sourceLanguage)
      .sort((a, b) => a.token.localeCompare(b.token))
  }, [dict, work])

  const unresolvedDraftTokens = useMemo(() => {
    if (!work.id) return []
    const raw = [
      ...editTokens.split('|'),
      ...(editSource.match(
        /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu
      ) || [])
    ]
      .map((v) => v.trim())
      .filter(Boolean)
    const unique = Array.from(new Set(raw))
    return unique.filter((token) => {
      const entry = dict[dictKey(work.sourceLanguage, token)]
      if (!entry) return true
      const hasMeaning = Boolean(
        entry.en?.trim() || entry.ja?.trim() || entry.origin?.trim()
      )
      const hasMeta = Boolean(
        entry.gender || (entry.grammarRefs && entry.grammarRefs.length > 0)
      )
      return !hasMeaning && !hasMeta && !entry.lemma && !entry.partOfSpeech
    })
  }, [work, dict, editTokens, editSource])

  const sentencePointers = useMemo(() => {
    const p: Array<{ w: string; s: string; x: string }> = []
    data.forEach((w) =>
      w.sections.forEach((s) =>
        s.sentences.forEach((x) => p.push({ w: w.id, s: s.id, x: x.id }))
      )
    )
    return p
  }, [data])

  const searchHits = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    const out: Array<{ w: Work; s: Work['sections'][number]; x: Sentence }> = []
    data.forEach((w) => {
      w.sections.forEach((s) => {
        s.sentences.forEach((x) => {
          const hay = [
            w.title,
            s.title,
            x.label,
            x.source,
            x.english,
            x.japanese,
            ...(x.notes || [])
          ]
            .join(' ')
            .toLowerCase()
          if (hay.includes(q)) out.push({ w, s, x })
        })
      })
    })
    return out
  }, [data, query])

  const moveSentence = (offset: number) => {
    if (!work.id || !section.id || !sentence.id) return
    const idx = sentencePointers.findIndex(
      (p) => p.w === work.id && p.s === section.id && p.x === sentence.id
    )
    if (idx < 0) return
    const next = sentencePointers[idx + offset]
    if (!next) return
    setWorkId(next.w)
    setSectionId(next.s)
    setSentenceId(next.x)
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        document
          .getElementById(`sentence-${next.x}`)
          ?.scrollIntoView({ block: 'nearest' })
      })
    )
  }

  const toggleRead = () => {
    if (!work.id || !section.id || !sentence.id) return
    const key = sentenceKey(work.id, section.id, sentence.id)
    const next = new Set(readSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setReadSet(next)
  }

  const toggleWeak = (token: string) => {
    if (!work.id) return
    const key = dictKey(work.sourceLanguage, token)
    const next = new Set(weakSet)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    setWeakSet(next)
  }

  const jumpToGrammar = (id: string) => {
    setStudyTab('grammar')
    setFocusGrammar(id)
    setPanelOpen(true)
    if (!sentence?.grammar.some((g) => g.id === id)) {
      for (const w of data)
        for (const s of w.sections) {
          const x = s.sentences.find((x) => x.grammar.some((g) => g.id === id))
          if (x) {
            setWorkId(w.id)
            setSectionId(s.id)
            setSentenceId(x.id)
            return
          }
        }
    }
  }

  const addSentence = () => {
    if (!work.id || !section.id) {
      setEditError('先に作品と章を作成してください。')
      return
    }
    setEditError('')
    setEditMessage('')
    if (!quickSource.trim()) {
      setEditError('新しい原文を入力してください。')
      return
    }
    if (!canEdit) return
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
      buildUp: quickBuild.trim()
        ? quickBuild
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [src],
      notes: quickNotes.trim()
        ? quickNotes
            .split(/\r?\n/)
            .map((x) => x.trim())
            .filter(Boolean)
        : [],
      grammar: []
    }

    const insertSentences = (list: Sentence[]) => {
      if (quickInsertMode === 'end') return [...list, newSentence]
      const idx = list.findIndex((x) => x.id === sentence.id)
      if (idx < 0) return [...list, newSentence]
      return [...list.slice(0, idx + 1), newSentence, ...list.slice(idx + 1)]
    }

    const added = setData((prev) =>
      prev.map((w) =>
        w.id !== work.id
          ? w
          : {
              ...w,
              sections: w.sections.map((s) =>
                s.id !== section.id
                  ? s
                  : { ...s, sentences: insertSentences(s.sentences) }
              )
            }
      )
    )
    if (!added) return
    setEditorTab('source')
    setEditMessage('新しい文を追加しました。')
    setSentenceId(id)
    setQuickSource('')
    setQuickEnglish('')
    setQuickJapanese('')
    setQuickBuild('')
    setQuickNotes('')
    setQuickTokens('')
  }

  const deleteSentence = () => {
    if (!work.id || !section.id || !sentence.id) return
    if (!canEdit) return
    if (section.sentences.length <= 1) {
      setEditError('章の最後の1文は削除できません。')
      return
    }
    if (!window.confirm(`文を削除しますか？\n${sentence.label}`)) return

    const idx = section.sentences.findIndex((x) => x.id === sentence.id)
    const nextId = section.sentences[Math.max(0, idx - 1)].id
    const removed = protectedUpdate((prev) =>
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
                      sentences: s.sentences.filter((x) => x.id !== sentence.id)
                    }
              )
            }
      )
    )
    if (!removed) return
    setSentenceId(nextId)
  }

  const saveSentenceEdits = () => {
    if (!work.id || !section.id || !sentence.id) return
    if (!canEdit) return
    setEditError('')
    setEditMessage('')
    if (!editSource.trim()) {
      setEditError('原文は必須です。')
      return
    }
    if (!window.confirm('本文編集を保存しますか？')) return
    const nextSource = editSource.trim()
    if (!nextSource) {
      setEditError('原文は必須です。')
      return
    }
    const tokens = (editTokens.trim() ? editTokens : nextSource)
      .split(editTokens.trim() ? '|' : /\s+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text) => sentence.tokens.find((t) => t.text === text) || { text })
    const nextLabel =
      editLabel.trim() ||
      (nextSource.length > 70 ? `${nextSource.slice(0, 70)}...` : nextSource)
    const saved = setData((prev) =>
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
    if (saved) setEditMessage('本文・翻訳・構文・備考を保存しました。')
  }

  const clearVocabForm = () => {
    setVocabToken('')
    setVocabEnglish('')
    setVocabJapanese('')
    setVocabOrigin('')
    setVocabGender('')
    setVocabGrammarRefs('')
    setVocabLemma('')
    setVocabPartOfSpeech('')
  }

  const saveVocabEntry = () => {
    if (!work.id || !canEdit) return
    setEditError('')
    setEditMessage('')
    const token = vocabToken.trim()
    if (!token) {
      setEditError('単語は必須です。')
      return
    }
    if (vocabLemma.trim() === token) {
      setEditError('辞書形は空欄にするか、異なる見出し語を指定してください。')
      return
    }
    if (!window.confirm(`単語「${token}」を保存しますか？`)) return
    const key = dictKey(work.sourceLanguage, token)
    const nextDict = {
      ...dict,
      [key]: {
        sourceLanguage: work.sourceLanguage,
        token,
        lemma: vocabLemma.trim(),
        partOfSpeech: vocabPartOfSpeech.trim(),
        en: vocabEnglish.trim(),
        ja: vocabJapanese.trim(),
        origin: vocabOrigin.trim(),
        gender: normalizeGender(vocabGender),
        grammarRefs: vocabGrammarRefs
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean)
      }
    }
    const attach =
      sentence.id &&
      sentence.source.includes(token) &&
      !sentence.tokens.some((t) => t.text === token)
    const nextData = attach
      ? data.map((w) =>
          w.id === work.id
            ? {
                ...w,
                sections: w.sections.map((s) =>
                  s.id === section.id
                    ? {
                        ...s,
                        sentences: s.sentences.map((x) =>
                          x.id === sentence.id
                            ? { ...x, tokens: [...x.tokens, { text: token }] }
                            : x
                        )
                      }
                    : s
                )
              }
            : w
        )
      : data
    if (!commitMaterials(nextData, nextDict, '語彙と語句参照の保存')) return
    setEditMessage('単語を保存しました。')
    if (editSource.includes(token)) {
      const texts = editTokens
        .split('|')
        .map((v) => v.trim())
        .filter(Boolean)
      if (!texts.includes(token))
        editor.setters.setEditTokens([...texts, token].join(' | '))
    }
    try {
      const drafts = readLocal<Record<string, unknown>>(
        'rsl-react-vocabulary-drafts',
        {}
      )
      delete drafts[key]
      localStorage.setItem(
        'rsl-react-vocabulary-drafts',
        JSON.stringify(drafts)
      )
    } catch {
      /* The sentence draft retains the current form. */
    }
  }

  const loadVocabEntry = (entry: DictEntry) => {
    setVocabLemma(entry.lemma || '')
    setVocabPartOfSpeech(entry.partOfSpeech || '')
    setVocabToken(entry.token)
    setVocabEnglish(entry.en)
    setVocabJapanese(entry.ja)
    setVocabOrigin(entry.origin)
    setVocabGender(normalizeGender(entry.gender))
    setVocabGrammarRefs((entry.grammarRefs || []).join(', '))
  }

  const deleteVocabEntry = (token: string) => {
    if (!work.id) return
    if (!canEdit) return
    if (!window.confirm(`単語「${token}」を削除しますか？`)) return
    const key = dictKey(work.sourceLanguage, token)
    const next = { ...dict }
    delete next[key]
    if (!commitMaterials(data, next, '単語の削除', true)) return
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
    setGrammarTableRows(
      (item.tableRows || []).map((r) => r.join(' | ')).join('\n')
    )
  }

  const saveGrammarItem = () => {
    if (!work.id || !section.id || !sentence.id) return
    if (!canEdit) return
    setEditError('')
    setEditMessage('')
    const title = grammarTitle.trim()
    if (!title) {
      setEditError('文法タイトルは必須です。')
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
        .map((line) => line.split('|').map((cell) => cell.trim()))
    }

    const saved = setData((prev) =>
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
                                ? x.grammar.map((g) =>
                                    g.id === idSeed ? item : g
                                  )
                                : [...x.grammar, item]
                            }
                      )
                    }
              )
            }
      )
    )
    if (!saved) return
    setEditMessage('文法を保存しました。')
    setGrammarId(idSeed)
  }

  const deleteGrammarItem = (id: string) => {
    if (!work.id || !section.id || !sentence.id) return
    if (!canEdit) return
    if (!window.confirm(`文法項目「${id}」を削除しますか？`)) return
    const removed = protectedUpdate((prev) =>
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
                              grammar: x.grammar.filter((g) => g.id !== id)
                            }
                      )
                    }
              )
            }
      )
    )
    if (!removed) return
    if (grammarId === id) {
      clearGrammarForm()
    }
  }

  const exportBackup = () => {
    const payload = {
      app: 'reading-studio',
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
      dict,
      progress: { read: Array.from(readSet), weak: Array.from(weakSet) },
      drafts: readLocal('rsl-react-editor-drafts', {}),
      vocabularyDrafts: readLocal('rsl-react-vocabulary-drafts', {}),
      bulkDraft: readLocal('rsl-react-bulk-draft', null)
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reading-studio-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importBackup = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          data?: Work[]
          dict?: unknown
          progress?: { read?: string[]; weak?: string[] }
          drafts?: unknown
          vocabularyDrafts?: unknown
          bulkDraft?: unknown
        }
        if (!Array.isArray(parsed.data)) {
          window.alert('バックアップファイルに作品データが見つかりません')
          return
        }
        if (
          !window.confirm(
            '現在のデータをバックアップの内容で置き換えますか？\n（直前の教材・辞書・下書き・進捗を保護コピーに保存します）'
          )
        )
          return
        const snapshot: MaterialSnapshot = {
          version: 1,
          data: parsed.data,
          dict: hydrateDictRecord(parsed.dict)
        }
        if (!isMaterialSnapshot(snapshot)) {
          window.alert(
            '教材の形式を確認してください。現在のデータは変更していません。'
          )
          return
        }
        try {
          const restore: Recovery = {
            createdAt: new Date().toISOString(),
            reason: 'バックアップ復元',
            snapshot,
            drafts: parsed.drafts ?? readLocal('rsl-react-editor-drafts', {}),
            progress: parsed.progress || { read: [], weak: [] },
            vocabularyDrafts:
              parsed.vocabularyDrafts ??
              readLocal('rsl-react-vocabulary-drafts', {}),
            bulkDraft:
              parsed.bulkDraft ?? readLocal('rsl-react-bulk-draft', null)
          }
          restoreMaterials(
            localStorage,
            restore,
            { version: 1, data, dict },
            'バックアップの読み込み'
          )
          setDataState(snapshot.data)
          setDictState(snapshot.dict)
          setReadSet(new Set(parsed.progress?.read || []))
          setWeakSet(new Set(parsed.progress?.weak || []))
          setEditorEpoch((v) => v + 1)
          setStorageError('')
        } catch {
          window.alert(
            '保存容量または保護コピーを確認してください。バックアップ復元を中止しました。'
          )
          return
        }
        const w = parsed.data[0]
        setWorkId(w?.id || '')
        setSectionId(w?.sections[0]?.id || '')
        setSentenceId(w?.sections[0]?.sentences[0]?.id || '')
      } catch {
        window.alert(
          'バックアップファイルの読み込みに失敗しました（JSON形式が不正です）'
        )
      }
    }
    reader.readAsText(file)
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
      const result = await signUpWithPassword(
        email.trim(),
        password,
        window.location.origin
      )
      if (result.accessToken) {
        setAccessToken(result.accessToken)
      }
      if (result.accessToken && result.user.id) setAuthUser(result.user)
      setAuthMessage(
        'サインアップ成功。確認メール設定の場合はメール認証してください。'
      )
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
      setPageMode('read')
      setAuthBusy(false)
      setAuthMessage('ログアウトしました')
    }
  }

  const [dragging, setDragging] = useState(false)
  useEffect(() => {
    if (!dragging) return
    const onMove = (e: MouseEvent) => {
      setPaneWidth(Math.max(230, Math.min(360, e.clientX)))
    }
    const onUp = () => setDragging(false)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [dragging])

  const protectedUpdate = (updater: (data: Work[]) => Work[]) =>
    commitMaterials(updater(data), dict, '教材項目の削除', true)
  const pickVocabulary = (text: string) => {
    if (!canEdit || !text.trim()) return
    try {
      const all = readLocal<Record<string, Partial<typeof editor.values>>>(
        'rsl-react-vocabulary-drafts',
        {}
      )
      if (vocabToken.trim())
        all[dictKey(work.sourceLanguage, vocabToken.trim())] = {
          vocabToken,
          vocabEnglish,
          vocabJapanese,
          vocabOrigin,
          vocabGender,
          vocabGrammarRefs,
          vocabLemma,
          vocabPartOfSpeech
        }
      localStorage.setItem('rsl-react-vocabulary-drafts', JSON.stringify(all))
      const cached = all[dictKey(work.sourceLanguage, text)]
      const original = dict[dictKey(work.sourceLanguage, text)]
      const annotation = sentence.tokens.find((t) => t.text === text)
      loadVocabEntry(
        original || {
          sourceLanguage: work.sourceLanguage,
          token: text,
          en: annotation?.en || '',
          ja: annotation?.ja || '',
          origin: annotation?.origin || '',
          gender: annotation?.gender || '',
          grammarRefs: annotation?.grammarRefs || [],
          lemma: annotation?.lemma || '',
          partOfSpeech: annotation?.partOfSpeech || ''
        }
      )
      if (cached) {
        for (const field of [
          'vocabToken',
          'vocabEnglish',
          'vocabJapanese',
          'vocabOrigin',
          'vocabGender',
          'vocabGrammarRefs',
          'vocabLemma',
          'vocabPartOfSpeech'
        ] as const) {
          if (typeof cached[field] === 'string') {
            const setter = editor.setters[
              `set${field[0].toUpperCase()}${field.slice(1)}` as keyof typeof editor.setters
            ] as (value: string) => void
            setter(cached[field]!)
          }
        }
      }
      setEditorTab('vocabulary')
      setEditError('')
      setEditMessage('')
    } catch {
      setEditError(
        '語彙の下書きを保存できません。現在の入力を保存してから切り替えてください。'
      )
    }
  }
  const commitBulk = (request: BulkRequest) => {
    if (!canEdit) return false
    const current = readLocal<Work[]>(LS_DATA, data)
    const target = current.find((w) => w.id === request.workId)
    if (!target || !request.sentences.length) return false
    if (
      target.sections.some((s) => s.id === request.newSectionId) ||
      request.sentences.some((x) =>
        target.sections.some((s) => s.sentences.some((t) => t.id === x.id))
      )
    )
      return false
    if (
      request.sectionId &&
      !target.sections.some((s) => s.id === request.sectionId)
    )
      return false
    const sectionId = request.sectionId || request.newSectionId
    const next = current.map((w) =>
      w.id !== target.id
        ? w
        : {
            ...w,
            sections: request.sectionId
              ? w.sections.map((s) =>
                  s.id === sectionId
                    ? {
                        ...s,
                        sentences: [...s.sentences, ...request.sentences]
                      }
                    : s
                )
              : [
                  ...w.sections,
                  {
                    id: sectionId,
                    title: request.title,
                    sentences: request.sentences
                  }
                ]
          }
    )
    if (!commitMaterials(next, dict, '本文の一括登録', true)) return false
    setWorkId(target.id)
    setSectionId(sectionId)
    setSentenceId(request.sentences[0].id)
    return true
  }
  const restoreRecovery = () => {
    if (!canEdit) return false
    const recovery = readLocal<Recovery | null>(RECOVERY_KEY, null)
    if (!recovery || !isMaterialSnapshot(recovery.snapshot)) {
      window.alert('復元できる保護コピーがありません。')
      return false
    }
    if (
      !window.confirm(
        `${recovery.reason}の直前 (${new Date(recovery.createdAt).toLocaleString()}) に戻しますか？現在の教材・下書きも保護コピーへ退避します。`
      )
    )
      return false
    try {
      restoreMaterials(localStorage, recovery, { version: 1, data, dict })
      setDataState(recovery.snapshot.data)
      setDictState(recovery.snapshot.dict)
      const progress = readLocal<{ read?: string[]; weak?: string[] }>(
        'rsl-react-progress',
        {}
      )
      setReadSet(new Set(progress.read || []))
      setWeakSet(new Set(progress.weak || []))
      setEditorEpoch((v) => v + 1)
      setStorageError('')
    } catch {
      setStorageError(
        '復元に失敗したため、変更を取り消しました。保護コピーは保持しています。'
      )
      return false
    }
    const w = recovery.snapshot.data[0]
    setWorkId(w?.id || '')
    setSectionId(w?.sections[0]?.id || '')
    setSentenceId(w?.sections[0]?.sentences[0]?.id || '')
    return true
  }
  const applySnapshot = (snapshot: MaterialSnapshot) => {
    if (!isMaterialSnapshot(snapshot)) return false
    if (
      !window.confirm(
        'クラウドの教材で、このブラウザの教材を置き換えますか？現在の教材・辞書・下書き・進捗は保護コピーに保存します。'
      )
    )
      return false
    if (
      !commitMaterials(
        snapshot.data,
        snapshot.dict,
        'クラウド教材の読み込み',
        true
      )
    )
      return false
    const w = snapshot.data[0]
    setWorkId(w?.id || '')
    setSectionId(w?.sections[0]?.id || '')
    setSentenceId(w?.sections[0]?.sentences[0]?.id || '')
    return true
  }

  const scrollRestoring = useRef(false)
  const scrollKey = `${pageMode}::${readMode === 'reading' || bookMode ? `${work?.id}::${section?.id}::continuous` : draftKey}::${readMode}`
  useEffect(() => {
    if (!draftKey) return
    try {
      localStorage.setItem(
        'rsl-react-position',
        JSON.stringify({ w: work?.id, s: section?.id, x: sentence?.id })
      )
    } catch {
      /* Position is optional. */
    }
  }, [draftKey, work?.id, section?.id, sentence?.id])
  useEffect(() => {
    scrollRestoring.current = true
    const frame = requestAnimationFrame(() => {
      if (readerScroll.current)
        readerScroll.current.scrollTop =
          readLocal<Record<string, number>>('rsl-react-scroll', {})[
            scrollKey
          ] || 0
      scrollRestoring.current = false
    })
    return () => cancelAnimationFrame(frame)
  }, [scrollKey, pageMode])
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1100px)')
    const resize = () => {
      setSidebarOpen(media.matches)
      setPanelOpen(media.matches && readMode === 'study')
    }
    media.addEventListener('change', resize)
    return () => media.removeEventListener('change', resize)
  }, [readMode])
  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false)
        setPanelOpen(false)
      }
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [])

  const pointerIndex = sentencePointers.findIndex(
    (p) => p.w === work.id && p.s === section.id && p.x === sentence.id
  )
  const baseline = initialDraft(sentence)
  const sentenceDirty = (
    [
      'editLabel',
      'editSource',
      'editEnglish',
      'editJapanese',
      'editBuild',
      'editNotes',
      'editTokens'
    ] as const
  ).some((k) => editor.values[k] !== baseline[k])
  const vocabBaseline = dict[dictKey(work.sourceLanguage, vocabToken.trim())]
  const vocabDirty =
    Boolean(
      vocabToken ||
      vocabEnglish ||
      vocabJapanese ||
      vocabOrigin ||
      vocabGender ||
      vocabGrammarRefs ||
      vocabLemma ||
      vocabPartOfSpeech
    ) &&
    (!vocabBaseline ||
      vocabEnglish !== vocabBaseline.en ||
      vocabJapanese !== vocabBaseline.ja ||
      vocabOrigin !== vocabBaseline.origin ||
      vocabGender !== vocabBaseline.gender ||
      vocabGrammarRefs !== vocabBaseline.grammarRefs.join(', ') ||
      vocabLemma !== (vocabBaseline.lemma || '') ||
      vocabPartOfSpeech !== (vocabBaseline.partOfSpeech || ''))
  const grammarBaseline = sentence.grammar.find((g) => g.id === grammarId)
  const grammarDirty =
    Boolean(
      grammarId ||
      grammarTitle ||
      grammarBody ||
      grammarTags ||
      grammarTableRows
    ) &&
    (!grammarBaseline ||
      grammarTitle !== grammarBaseline.title ||
      grammarBody !== grammarBaseline.body ||
      grammarType !== (grammarBaseline.type || 'grammar') ||
      grammarTags !== (grammarBaseline.tags || []).join(', ') ||
      grammarTableRows !==
        (grammarBaseline.tableRows || []).map((r) => r.join(' | ')).join('\n'))
  const dirty =
    sentenceDirty ||
    vocabDirty ||
    grammarDirty ||
    Boolean(
      quickSource ||
      quickEnglish ||
      quickJapanese ||
      quickBuild ||
      quickNotes ||
      quickTokens
    )
  const select = (w: string, s: string, x: string) => {
    setWorkId(w)
    setSectionId(s)
    setSentenceId(x)
    setEditMessage('')
    setEditError('')
    setFocusGrammar(null)
    if (window.innerWidth < 1100) setSidebarOpen(false)
  }
  const switchMode = (mode: 'reading' | 'study') => {
    if (mode === readMode) return
    setReadMode(mode)
    setPanelOpen(mode === 'study' && window.innerWidth >= 1100)
    if (mode === 'reading') {
      setBookShowSource(true)
      setBookShowEnglish(false)
      setBookShowJapanese(false)
    } else setBookShowJapanese(true)
  }
  const persistScroll = () => {
    if (scrollRestoring.current || !readerScroll.current) return
    try {
      const all = readLocal<Record<string, number>>('rsl-react-scroll', {})
      all[scrollKey] = readerScroll.current.scrollTop
      localStorage.setItem('rsl-react-scroll', JSON.stringify(all))
    } catch {
      /* Reading remains available without scroll persistence. */
    }
  }
  return (
    <div
      className={`app page-${pageMode} ${sidebarOpen ? 'library-open' : ''} ${panelOpen && pageMode === 'read' ? 'study-open' : ''}`}
      data-theme={theme}
      style={{
        ['--left-pane-width' as string]: `${paneWidth}px`,
        ['--read-scale' as string]: String(fontScale)
      }}
    >
      <a className="skip-link" href="#reading-main">
        本文へ移動
      </a>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            R<span>·</span>
          </span>
          <span>
            Reading Studio<small>LITERATURE & LANGUAGE</small>
          </span>
        </div>
        <nav className="page-switch" aria-label="ページ">
          <button
            aria-pressed={pageMode === 'read'}
            onClick={() => setPageMode('read')}
          >
            読書
          </button>
          <button
            aria-pressed={pageMode === 'edit'}
            onClick={() => {
              if (canEdit) {
                setPageMode('edit')
                setPanelOpen(false)
              } else {
                setAuthMessage(
                  '編集には権限のあるアカウントでログインしてください。'
                )
                setAccountOpen(true)
              }
            }}
          >
            教材編集
          </button>
        </nav>
        <div className="topbar-actions">
          <button
            className="quiet theme-button"
            onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
            aria-label={
              theme === 'light' ? 'ダークモードにする' : 'ライトモードにする'
            }
          >
            {theme === 'light' ? '夜の配色' : '昼の配色'}
          </button>
          <button
            className="account-button"
            aria-haspopup="dialog"
            onClick={() => setAccountOpen(true)}
          >
            <span className="account-dot" aria-hidden="true" />
            {authUser ? 'アカウント' : 'ログイン'}
          </button>
        </div>
      </header>
      <div className="workspace-bar">
        <button
          aria-expanded={sidebarOpen}
          aria-controls="library"
          className="library-toggle"
          onClick={() => {
            setSidebarOpen((v) => !v)
            if (window.innerWidth < 1100) setPanelOpen(false)
          }}
        >
          <span aria-hidden="true">☰</span> ライブラリ
        </button>
        <div className="breadcrumbs">
          <span>{work.title}</span>
          <span aria-hidden="true">/</span>
          <span>{section.title}</span>
        </div>
        <span className="workspace-label">
          {pageMode === 'edit' ? '教材編集' : '読書ノート'}
        </span>
      </div>
      {storageError && (
        <p className="global-error" role="alert">
          {storageError}
        </p>
      )}
      <div className="workspace">
        {sidebarOpen && (
          <>
            <button
              className="drawer-backdrop library-backdrop"
              onClick={() => setSidebarOpen(false)}
              aria-label="ライブラリを閉じる"
            />
            <aside
              ref={libraryRef}
              id="library"
              className="library"
              aria-label="ライブラリ"
            >
              <Library
                data={data}
                work={work}
                sectionId={section.id}
                sentenceId={sentence.id}
                readSet={readSet}
                query={query}
                onQuery={setQuery}
                hits={searchHits}
                onSelect={select}
                onClose={() => setSidebarOpen(false)}
                onExport={exportBackup}
                onImport={importBackup}
                onManage={canEdit ? () => setManagerOpen(true) : undefined}
                onCloud={() => setCloudOpen(true)}
              />
            </aside>
            <div
              className="splitter"
              role="separator"
              aria-label="ライブラリの幅"
              aria-orientation="vertical"
              aria-valuenow={paneWidth}
              aria-valuemin={230}
              aria-valuemax={360}
              tabIndex={0}
              onMouseDown={() => setDragging(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                  e.preventDefault()
                  setPaneWidth((v) =>
                    Math.max(
                      230,
                      Math.min(360, v + (e.key === 'ArrowRight' ? 10 : -10))
                    )
                  )
                }
              }}
            />
          </>
        )}
        <main
          className="reading-column"
          id="reading-main"
          tabIndex={-1}
          ref={readerScroll}
          onScroll={persistScroll}
        >
          {pageMode === 'edit' && canEdit ? (
            <EditorPage
              draft={editor.values}
              setters={editor.setters}
              sentence={sentence}
              language={work.sourceLanguage}
              tab={editorTab}
              onTab={(t) => {
                setEditorTab(t)
                setEditError('')
                setEditMessage('')
              }}
              dirty={dirty}
              draftError={editor.error || storageError}
              message={editMessage}
              error={editError}
              canEdit={canEdit}
              onSave={saveSentenceEdits}
              onAdd={addSentence}
              onDelete={deleteSentence}
              onPreview={() => setPageMode('read')}
              onSaveVocab={saveVocabEntry}
              onClearVocab={clearVocabForm}
              onLoadVocab={loadVocabEntry}
              onDeleteVocab={deleteVocabEntry}
              vocabEntries={languageVocabEntries}
              unresolved={unresolvedDraftTokens}
              tokens={sentence.tokens}
              dict={dict}
              hasSentence={!!sentence.id}
              onPickVocab={pickVocabulary}
              weakSet={weakSet}
              onWeak={toggleWeak}
              onMove={moveSentence}
              canPrevious={pointerIndex > 0}
              canNext={
                !!sentence.id && pointerIndex < sentencePointers.length - 1
              }
              onSaveGrammar={saveGrammarItem}
              onClearGrammar={clearGrammarForm}
              onLoadGrammar={loadGrammarItem}
              onDeleteGrammar={deleteGrammarItem}
            />
          ) : (
            <>
              <div className="reading-controls">
                <div className="mode-switch" aria-label="読書モード">
                  <button
                    aria-pressed={readMode === 'reading'}
                    onClick={() => switchMode('reading')}
                  >
                    Reading<small>読む</small>
                  </button>
                  <button
                    aria-pressed={readMode === 'study'}
                    onClick={() => switchMode('study')}
                  >
                    Study<small>学ぶ</small>
                  </button>
                </div>
                <div className="row-actions">
                  <details className="display-options">
                    <summary>表示設定</summary>
                    <div className="display-popover">
                      <h3>本文の表示</h3>
                      <label>
                        <input
                          type="checkbox"
                          checked={bookShowSource}
                          onChange={(e) => {
                            if (
                              e.target.checked ||
                              bookShowEnglish ||
                              bookShowJapanese
                            )
                              setBookShowSource(e.target.checked)
                          }}
                        />
                        原文
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={bookShowEnglish}
                          onChange={(e) => {
                            setBookShowEnglish(e.target.checked)
                            if (!e.target.checked && !bookShowJapanese)
                              setBookShowSource(true)
                          }}
                        />
                        英語訳
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={bookShowJapanese}
                          onChange={(e) => {
                            setBookShowJapanese(e.target.checked)
                            if (!e.target.checked && !bookShowEnglish)
                              setBookShowSource(true)
                          }}
                        />
                        日本語訳
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={comparison}
                          onChange={(e) => setComparison(e.target.checked)}
                        />
                        原文と翻訳を並べる
                      </label>
                      <label>
                        <input
                          type="checkbox"
                          checked={hintsOn}
                          onChange={(e) => setHintsOn(e.target.checked)}
                        />
                        単語のヒント
                      </label>
                      <div className="quick-translation-setting">
                        <label htmlFor="quick-translation-mode">
                          単語クイック翻訳
                        </label>
                        <select
                          id="quick-translation-mode"
                          value={quickTranslation}
                          onChange={(e) =>
                            setQuickTranslation(
                              quickTranslationMode(e.target.value)
                            )
                          }
                        >
                          <option value="off">OFF</option>
                          <option value="ja">日本語</option>
                          <option value="en">英語</option>
                          <option value="both">日本語＋英語</option>
                        </select>
                      </div>
                      <label>
                        <input
                          type="checkbox"
                          checked={genderOn}
                          onChange={(e) => setGenderOn(e.target.checked)}
                        />
                        性カラー
                      </label>
                      {genderOn && (
                        <p className="gender-legend">
                          <span className="gender-m">男性 m</span>
                          <span className="gender-f">女性 f</span>
                          <span className="gender-n">中性 n</span>
                        </p>
                      )}
                      <p className="muted">
                        苦手語は点線の下線。選択語は薄い緑色。
                      </p>
                      <div className="font-controls">
                        <span>文字サイズ</span>
                        <button
                          onClick={() =>
                            setFontScale((v) =>
                              Math.max(0.8, +(v - 0.1).toFixed(1))
                            )
                          }
                          aria-label="文字を小さく"
                        >
                          A−
                        </button>
                        <small>{Math.round(fontScale * 100)}%</small>
                        <button
                          onClick={() =>
                            setFontScale((v) =>
                              Math.min(1.6, +(v + 0.1).toFixed(1))
                            )
                          }
                          aria-label="文字を大きく"
                        >
                          A＋
                        </button>
                      </div>
                    </div>
                  </details>
                  <button
                    aria-expanded={panelOpen}
                    aria-controls="study-panel"
                    onClick={() => {
                      setPanelOpen((v) => !v)
                      if (window.innerWidth < 1100) setSidebarOpen(false)
                    }}
                  >
                    {panelOpen ? '解説を閉じる' : '解説を開く'}
                  </button>
                </div>
              </div>
              {sentence.id ? (
                <Reader
                  key={`${work.id}::${section.id}::${readMode}::${bookMode}::${readMode === 'study' && !bookMode ? sentence.id : ''}::${bookShowSource}::${quickTranslation}`}
                  work={work}
                  section={section}
                  sentence={sentence}
                  mode={readMode}
                  bookMode={bookMode}
                  english={bookShowEnglish}
                  japanese={bookShowJapanese}
                  sourceOn={bookShowSource}
                  comparison={comparison}
                  hintsOn={hintsOn}
                  quickTranslation={quickTranslation}
                  genderOn={genderOn}
                  dict={dict}
                  weakSet={weakSet}
                  readSet={readSet}
                  selectedToken={selectedToken}
                  onSentence={(id, explain) => {
                    setSentenceId(id)
                    if (explain) setPanelOpen(true)
                  }}
                  onToken={(text) => {
                    setSelectedToken(text)
                    setStudyTab('vocabulary')
                    setPanelOpen(true)
                  }}
                  onMove={moveSentence}
                  onRead={toggleRead}
                  onBook={() => setBookMode((v) => !v)}
                  canPrevious={pointerIndex > 0}
                  canNext={pointerIndex < sentencePointers.length - 1}
                />
              ) : (
                <section className="empty-material">
                  <h1>
                    {work.id
                      ? section.id
                        ? 'この章に文を追加しましょう'
                        : '章を作成しましょう'
                      : '新しい作品を作成しましょう'}
                  </h1>
                  <p className="muted">
                    既存の教材は保持しています。ライブラリ管理から作品・章・本文の一括登録を進められます。
                  </p>
                  {canEdit && (
                    <div className="row-actions">
                      <button onClick={() => setManagerOpen(true)}>
                        作品・章を管理
                      </button>
                      {section.id && (
                        <button
                          onClick={() => {
                            setPageMode('edit')
                            setEditorTab('new')
                          }}
                        >
                          文を追加する
                        </button>
                      )}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </main>
        {panelOpen && pageMode === 'read' && (
          <>
            <button
              className="drawer-backdrop study-backdrop"
              onClick={() => setPanelOpen(false)}
              aria-label="解説を閉じる"
            />
            <aside
              ref={studyRef}
              className="study-panel"
              id="study-panel"
              aria-label="学習と解説"
            >
              <StudyPanel
                sentence={sentence}
                language={work.sourceLanguage}
                tokens={mergedTokens}
                tab={studyTab}
                onTab={setStudyTab}
                onClose={() => setPanelOpen(false)}
                english={bookShowEnglish}
                japanese={bookShowJapanese}
                toggleEnglish={() => {
                  setBookShowEnglish((v) => !v)
                  if (bookShowEnglish && !bookShowJapanese)
                    setBookShowSource(true)
                }}
                toggleJapanese={() => {
                  setBookShowJapanese((v) => !v)
                  if (bookShowJapanese && !bookShowEnglish)
                    setBookShowSource(true)
                }}
                weakSet={weakSet}
                toggleWeak={toggleWeak}
                onGrammar={jumpToGrammar}
                focusGrammar={focusGrammar}
                selectedToken={selectedToken}
                onEditToken={
                  canEdit
                    ? (t) => {
                        loadVocabEntry({
                          sourceLanguage: work.sourceLanguage,
                          token: t.text,
                          en: t.en || '',
                          ja: t.ja || '',
                          origin: t.origin || '',
                          gender: t.gender || '',
                          grammarRefs: t.grammarRefs || []
                        })
                        setEditorTab('vocabulary')
                        setPageMode('edit')
                      }
                    : undefined
                }
              />
            </aside>
          </>
        )}
      </div>
      {accountOpen && (
        <Dialog title="アカウント" onClose={() => setAccountOpen(false)}>
          {!authReady ? (
            <p>認証情報を確認中...</p>
          ) : authUser ? (
            <div className="account-info">
              <p>{authUser.email || authUser.id}</p>
              <p className="muted">編集権限: {canEdit ? 'あり' : 'なし'}</p>
              <button onClick={handleSignOut} disabled={authBusy}>
                ログアウト
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void handleSignIn()
              }}
            >
              <label className="field">
                メールアドレス
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <label className="field">
                パスワード
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>
              <div className="row-actions">
                <button type="submit" className="primary" disabled={authBusy}>
                  ログイン
                </button>
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={authBusy}
                >
                  サインアップ
                </button>
              </div>
            </form>
          )}
          {authMessage && (
            <p className="auth-message" role="status">
              {authMessage}
            </p>
          )}
        </Dialog>
      )}
      {managerOpen && canEdit && (
        <Dialog
          title="作品・章の管理"
          onClose={() => setManagerOpen(false)}
          wide
        >
          <LibraryManager
            data={data}
            workId={work.id}
            onCommit={(next, reason, protect) =>
              canEdit && commitMaterials(next, dict, reason, protect)
            }
            onSelect={(w, s, x) => {
              setWorkId(w)
              setSectionId(s)
              setSentenceId(x)
            }}
            onBulk={commitBulk}
            onRestore={restoreRecovery}
            onExport={exportBackup}
          />
        </Dialog>
      )}
      {cloudOpen && (
        <Dialog title="保存と共有" onClose={() => setCloudOpen(false)} wide>
          <CloudMaterials
            key={authUser?.id || 'signed-out'}
            token={accessToken}
            userId={authUser?.id || ''}
            canEdit={canEdit}
            snapshot={{ version: 1, data, dict }}
            onApply={applySnapshot}
            onExport={exportBackup}
          />
        </Dialog>
      )}
    </div>
  )
}
