import { useLayoutEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import {
  quickTranslationLines,
  quickTranslationPosition,
  type QuickTranslationMode
} from '../lib/quickTranslation'
import type { QuickTranslationTarget } from '../hooks/useQuickTranslation'

export function QuickTranslation({
  target,
  mode,
  id,
  popupRef,
  onDismiss,
  onDetails,
  onEnter,
  onLeave
}: {
  target: QuickTranslationTarget
  mode: QuickTranslationMode
  id: string
  popupRef: RefObject<HTMLDivElement | null>
  onDismiss: () => void
  onDetails: () => void
  onEnter: () => void
  onLeave: () => void
}) {
  useLayoutEffect(() => {
    const popup = popupRef.current
    if (!popup) return
    const position = () => {
      if (!target.anchor.isConnected) {
        popup.style.visibility = 'hidden'
        return
      }
      const visual = window.visualViewport
      const viewport = {
        left: visual?.offsetLeft || 0,
        top: visual?.offsetTop || 0,
        width: visual?.width || window.innerWidth,
        height: visual?.height || window.innerHeight
      }
      const rect = popup.getBoundingClientRect()
      const result = quickTranslationPosition(
        target.anchor.getBoundingClientRect(),
        rect,
        viewport
      )
      popup.style.left = `${result.left}px`
      popup.style.top = `${result.top}px`
      popup.dataset.placement = result.placement
      popup.style.visibility = 'visible'
    }
    position()
    const observer = new ResizeObserver(position)
    observer.observe(popup)
    observer.observe(target.anchor)
    window.addEventListener('resize', position)
    window.visualViewport?.addEventListener('resize', position)
    window.visualViewport?.addEventListener('scroll', position)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('resize', position)
      window.visualViewport?.removeEventListener('scroll', position)
    }
  }, [target, mode, popupRef])

  const touch = target.interaction === 'touch'
  return createPortal(
    <div
      ref={popupRef}
      id={id}
      className="quick-translation"
      role={touch ? 'dialog' : 'tooltip'}
      aria-label={touch ? `${target.token.text}のクイック翻訳` : undefined}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
    >
      <div className="quick-translation-heading">
        <span>{target.token.text}</span>
        {touch && (
          <button
            type="button"
            aria-label="クイック翻訳を閉じる"
            onClick={onDismiss}
          >
            ×
          </button>
        )}
      </div>
      {quickTranslationLines(target.token, mode).map((line) => (
        <p
          key={line.language}
          className={line.missing ? 'quick-translation-missing' : ''}
        >
          <span className="quick-translation-language">
            {line.language === 'ja' ? 'JA' : 'EN'}
          </span>
          <span lang={line.missing ? 'ja' : line.language}>{line.text}</span>
        </p>
      ))}
      {touch && (
        <button
          type="button"
          className="quick-translation-details"
          onClick={onDetails}
        >
          詳しく見る →
        </button>
      )}
    </div>,
    document.body
  )
}
