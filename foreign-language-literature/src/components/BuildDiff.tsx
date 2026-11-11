export function diffBuildStep(prev: string, cur: string) {
  const normalize = (x: string) =>
    x.toLowerCase().replace(/[.,!?;:()[\]{}"']/g, '')
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
