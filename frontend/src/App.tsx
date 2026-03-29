import { useState } from 'react'
import TopicPicker from './components/TopicPicker'
import DebatePlayer from './components/DebatePlayer'

interface ScriptLine {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
}

interface Clip {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
  audio_url: string
}

type Stage = 'picking' | 'generating' | 'synthesizing' | 'ready'

export default function App() {
  const [topic, setTopic] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('picking')
  const [clips, setClips] = useState<Clip[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(selectedTopic: string) {
    setError(null)
    setClips(null)

    setStage('generating')
    let generatedScript: ScriptLine[]
    try {
      const r = await fetch('/api/debate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: selectedTopic }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail)
      generatedScript = d.script
    } catch (e: any) {
      setError(e.message ?? 'script generation failed')
      setStage('picking')
      return
    }

    setStage('synthesizing')
    try {
      const r = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: generatedScript }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail)
      setClips(d.clips)
      setStage('ready')
    } catch (e: any) {
      setError(e.message ?? 'voice synthesis failed')
      setStage('picking')
    }
  }

  function reset() {
    setTopic(null)
    setClips(null)
    setError(null)
    setStage('picking')
  }

  function handleTopicSelect(t: string) {
    setTopic(t)
  }

  if (stage === 'ready' && clips) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
        <div className="flex items-center gap-4 w-full max-w-2xl">
          <button onClick={reset} className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
            ← back
          </button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">gooseTakes.fm</h1>
        </div>
        <p className="text-sm text-muted-foreground max-w-2xl w-full truncate">
          topic: <span className="text-foreground">"{topic}"</span>
        </p>
        <DebatePlayer clips={clips} />
      </div>
    )
  }

  const loading = stage === 'generating' || stage === 'synthesizing'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
      <h1 className="text-4xl font-bold text-foreground tracking-tight">gooseTakes.fm</h1>

      {!loading && <TopicPicker onSelect={handleTopicSelect} />}

      {loading && (
        <div className="flex flex-col items-center gap-3 py-12">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm">
            {stage === 'generating' ? 'writing the script...' : 'cloning voices...'}
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-destructive text-sm">{error}</p>
          <button onClick={reset} className="text-sm text-muted-foreground underline cursor-pointer">
            try again
          </button>
        </div>
      )}

      {topic && !loading && !error && (
        <button
          onClick={() => generate(topic)}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer"
        >
          generate debate
        </button>
      )}
    </div>
  )
}
