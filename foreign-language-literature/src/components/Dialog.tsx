import { useEffect, useRef, type ReactNode } from 'react'

export function Dialog({
  title,
  onClose,
  children
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    const previous = document.activeElement as HTMLElement | null
    dialog?.showModal()
    return () => {
      dialog?.close()
      previous?.focus()
    }
  }, [])
  return (
    <dialog
      ref={ref}
      className="account-dialog"
      aria-label={title}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="panel-heading">
        <h2>{title}</h2>
        <button onClick={onClose} aria-label="閉じる">
          閉じる
        </button>
      </div>
      {children}
    </dialog>
  )
}
