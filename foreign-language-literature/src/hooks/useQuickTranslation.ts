import { useEffect, useEffectEvent, useId, useRef, useState } from 'react'
import type { Token } from '../models'
import type { QuickTranslationMode } from '../lib/quickTranslation'

export type QuickTranslationTarget = {
  anchor: HTMLButtonElement
  token: Token
  sentenceId: string
  interaction: 'hover' | 'focus' | 'touch'
}

export function useQuickTranslation(mode: QuickTranslationMode) {
  const [target, setTarget] = useState<QuickTranslationTarget | null>(null)
  const popupRef = useRef<HTMLDivElement>(null)
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const pointerType = useRef('mouse')
  const id = useId()
  const cancelHide = () => clearTimeout(hideTimer.current)
  const cancelShow = () => clearTimeout(showTimer.current)
  const dismiss = () => {
    cancelShow()
    cancelHide()
    setTarget(null)
  }
  const schedule = (next: QuickTranslationTarget) => {
    cancelShow()
    cancelHide()
    if (mode === 'off') return
    showTimer.current = setTimeout(
      () => {
        if (next.anchor.isConnected) setTarget(next)
      },
      next.interaction === 'focus' ? 120 : 280
    )
  }
  const leave = (blur = false) => {
    cancelShow()
    if (
      target?.interaction === 'touch' ||
      (!blur &&
        target?.interaction === 'focus' &&
        target.anchor === document.activeElement)
    )
      return
    cancelHide()
    hideTimer.current = setTimeout(() => setTarget(null), 160)
  }
  const tap = (next: Omit<QuickTranslationTarget, 'interaction'>) => {
    cancelShow()
    cancelHide()
    setTarget((current) =>
      current?.anchor === next.anchor && current.interaction === 'touch'
        ? null
        : { ...next, interaction: 'touch' }
    )
  }

  const outside = useEffectEvent((event: PointerEvent) => {
    const element = event.target as Node | null
    if (
      !target?.anchor.contains(element) &&
      !popupRef.current?.contains(element)
    )
      dismiss()
  })
  const escape = useEffectEvent((event: KeyboardEvent) => {
    pointerType.current = 'keyboard'
    if (event.key === 'Escape') {
      cancelShow()
      if (target) {
        event.preventDefault()
        event.stopPropagation()
        dismiss()
      }
    }
  })
  const scroll = useEffectEvent((event: Event) => {
    if (
      !(event.target instanceof Node) ||
      !popupRef.current?.contains(event.target)
    )
      dismiss()
  })
  const focus = useEffectEvent((event: FocusEvent) => {
    const element = event.target as Node | null
    if (
      target &&
      !target.anchor.contains(element) &&
      !popupRef.current?.contains(element)
    )
      dismiss()
  })
  useEffect(() => {
    document.addEventListener('pointerdown', outside, true)
    document.addEventListener('keydown', escape, true)
    document.addEventListener('focusin', focus)
    document.addEventListener('scroll', scroll, true)
    window.addEventListener('blur', scroll)
    return () => {
      cancelShow()
      cancelHide()
      document.removeEventListener('pointerdown', outside, true)
      document.removeEventListener('keydown', escape, true)
      document.removeEventListener('focusin', focus)
      document.removeEventListener('scroll', scroll, true)
      window.removeEventListener('blur', scroll)
    }
  }, [])
  return {
    target: mode === 'off' ? null : target,
    id,
    popupRef,
    pointerType,
    schedule,
    leave,
    tap,
    cancelHide,
    dismiss
  }
}
