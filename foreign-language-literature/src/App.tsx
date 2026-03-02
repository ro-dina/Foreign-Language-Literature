import { useEffect, useMemo, useState } from 'react'
import './App.css'
import type { DictEntry, Sentence, Token, Work } from './models'
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
const LS_PROGRESS = 'rsl-react-progress'
const LS_UI = 'rsl-react-ui'
const LS_AUTH = 'rsl-react-auth'

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
  const [dict, setDict] = useState<Record<string, DictEntry>>(() => buildDictFromData(seedData))

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
    setDict(buildDictFromData(data))
  }, [data])

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

  const mergedTokens = useMemo(() => {
    if (!work || !sentence) return []
    return sentence.tokens.map((t) => mergeToken(work.sourceLanguage, t, dict))
  }, [work, sentence, dict])

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
      const result = await signUpWithPassword(email.trim(), password)
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

  const canEdit = Boolean(authUser)
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
