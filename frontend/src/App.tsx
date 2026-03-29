import { useState } from 'react'
import TopicPicker from './components/TopicPicker'

interface ScriptLine {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
}

const SPEAKER_COLOR: Record<string, string> = {
  TRUMP: 'text-red-400',
  ELON: 'text-blue-400',
  GORDON: 'text-orange-400',
}

export default function App() {
  const [topic, setTopic] = useState<string | null>(null)
  const [script, setScript] = useState<ScriptLine[] | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!topic) return
    setGenerating(true)
    setError(null)
    setScript(null)
    try {
      const r = await fetch('/api/debate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail)
      setScript(d.script)
    } catch (e: any) {
      setError(e.message ?? 'generation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
      <h1 className="text-4xl font-bold text-foreground tracking-tight">gooseTakes.fm</h1>

      <TopicPicker onSelect={(t) => { setTopic(t); setScript(null) }} />

      {topic && (
        <button
          onClick={generate}
          disabled={generating}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {generating ? 'generating...' : 'generate debate'}
        </button>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {script && (
        <div className="flex flex-col gap-3 w-full max-w-2xl">
          {script.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className={`font-bold text-sm w-16 shrink-0 ${SPEAKER_COLOR[line.speaker]}`}>
                {line.speaker}
              </span>
              <p className="text-foreground text-sm">{line.line}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
