import { useId } from 'react'
export function Tabs<T extends string>({
  label,
  tabs,
  value,
  onChange
}: {
  label: string
  tabs: readonly { id: T; label: string; count?: number }[]
  value: T
  onChange: (id: T) => void
}) {
  const id = useId()
  return (
    <div className="tabs" role="tablist" aria-label={label}>
      {tabs.map((tab, i) => (
        <button
          key={tab.id}
          id={`${id}-${tab.id}`}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          tabIndex={value === tab.id ? 0 : -1}
          onClick={() => onChange(tab.id)}
          onKeyDown={(e) => {
            let index = i
            if (e.key === 'ArrowRight') index = (i + 1) % tabs.length
            else if (e.key === 'ArrowLeft')
              index = (i - 1 + tabs.length) % tabs.length
            else if (e.key === 'Home') index = 0
            else if (e.key === 'End') index = tabs.length - 1
            else return
            e.preventDefault()
            onChange(tabs[index].id)
            document.getElementById(`${id}-${tabs[index].id}`)?.focus()
          }}
        >
          {tab.label}
          {tab.count !== undefined && <small>{tab.count}</small>}
        </button>
      ))}
    </div>
  )
}
