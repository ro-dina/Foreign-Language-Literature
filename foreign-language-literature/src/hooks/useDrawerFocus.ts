import { useEffect, useEffectEvent, type RefObject } from 'react'

export function useDrawerFocus(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onClose: () => void
) {
  const close = useEffectEvent(onClose)
  useEffect(() => {
    if (!open || !window.matchMedia('(max-width: 1099px)').matches) return
    const panel = ref.current
    if (!panel) return
    const previous = document.activeElement as HTMLElement | null
    const focusable = () =>
      [
        ...panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input, select, textarea, summary, [tabindex="0"]'
        )
      ].filter((el) => el.getClientRects().length)
    focusable()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0],
        last = items.at(-1)
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !panel.contains(document.activeElement))
      ) {
        event.preventDefault()
        last?.focus()
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !panel.contains(document.activeElement))
      ) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      if (previous?.isConnected) previous.focus({ preventScroll: true })
    }
  }, [open, ref])
}
