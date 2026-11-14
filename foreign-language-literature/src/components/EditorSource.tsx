import { useCallback, useEffect, useRef, useState } from 'react'
import type { DictEntry, Token } from '../models'
import { editorWords, hasVocabularyData } from '../lib/editorVocabulary'
export function EditorSource(p: {
  source: string
  language: string
  tokens: Token[]
  dict: Record<string, DictEntry>
  selected: string
  onPick: (text: string) => void
}) {
  const ref = useRef<HTMLParagraphElement>(null),
    [selection, setSelection] = useState('')
  const readSelection = useCallback(() => {
    const s = window.getSelection()
    setSelection(
      s &&
        !s.isCollapsed &&
        ref.current?.contains(s.anchorNode) &&
        ref.current?.contains(s.focusNode)
        ? s.toString().trim()
        : ''
    )
  }, [])
  useEffect(() => {
    document.addEventListener('selectionchange', readSelection)
    return () => document.removeEventListener('selectionchange', readSelection)
  }, [readSelection])
  return (
    <div className="editor-original">
      <div className="panel-heading">
        <h3>原文から語句を選ぶ</h3>
        <span className="registration-legend">
          下線あり: 登録済み / 点線: 未登録
        </span>
      </div>
      <p
        ref={ref}
        className="editor-source-text source"
        onPointerUp={readSelection}
        onKeyUp={readSelection}
      >
        {editorWords(p.source, p.language, p.tokens, p.dict).map((part, i) =>
          part.word ? (
            <button
              key={i}
              type="button"
              className={`editor-word ${hasVocabularyData(part.token) ? 'registered' : 'unregistered'} ${part.text === p.selected ? 'active' : ''}`}
              aria-label={`${part.text}を語彙編集`}
              aria-pressed={part.text === p.selected}
              onClick={() => {
                const selection = window.getSelection()
                if (
                  !selection ||
                  selection.isCollapsed ||
                  !ref.current?.contains(selection.anchorNode) ||
                  !ref.current?.contains(selection.focusNode)
                )
                  p.onPick(part.text)
              }}
            >
              {part.text}
            </button>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </p>
      {!p.source && (
        <p className="muted">原文を入力すると、ここから語句を登録できます。</p>
      )}
      <div className="row-actions">
        <button
          disabled={!selection}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            p.onPick(selection)
            window.getSelection()?.removeAllRanges()
            setSelection('')
          }}
        >
          選択した語句を登録
        </button>
        {selection && <span className="selected-phrase">{selection}</span>}
      </div>
    </div>
  )
}
