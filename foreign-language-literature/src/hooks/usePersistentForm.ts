import { useEffect, useState } from 'react'
export function usePersistentForm<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      return JSON.parse(localStorage.getItem(key) || 'null') || initial
    } catch {
      return initial
    }
  })
  const [error, setError] = useState('')
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
      queueMicrotask(() => setError(''))
    } catch {
      queueMicrotask(() => setError('このフォームの下書きを保存できません。'))
    }
  }, [key, value])
  return [value, setValue, error] as const
}
