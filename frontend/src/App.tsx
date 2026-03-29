import { useEffect, useState } from 'react'

export default function App() {
  const [ping, setPing] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/ping')
      .then((r) => r.json())
      .then((d) => setPing(d.message))
      .catch(() => setPing('backend unreachable'))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-xl">backend: {ping ?? 'connecting...'}</p>
    </div>
  )
}
