import { useState } from 'react'
import TopicPicker, { type SelectedTopic } from './components/TopicPicker'
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
  const [selected, setSelected] = useState<SelectedTopic | null>(null)
  const [stage, setStage] = useState<Stage>('picking')
  const [clips, setClips] = useState<Clip[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate(s: SelectedTopic) {
    setError(null)
    setClips(null)

    setStage('generating')
    let generatedScript: ScriptLine[]
    try {
      const r = await fetch('/api/debate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: s.title, body: s.body, comments: s.comments }),
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
    setSelected(null)
    setClips(null)
    setError(null)
    setStage('picking')
  }

  const loading = stage === 'generating' || stage === 'synthesizing'

  if (stage === 'ready' && clips && selected) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-6">
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer w-fit"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 1L3 7l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            back
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">gooseTakes.fm</h1>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1">"{selected.title}"</p>
          </div>
          <DebatePlayer clips={clips} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-10 flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-semibold text-foreground tracking-tight">gooseTakes.fm</h1>
          <p className="text-sm text-muted-foreground mt-1">
            pick a topic, get a debate between Trump, Elon, and Gordon Ramsay
          </p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              {stage === 'generating' ? 'writing the script...' : 'cloning voices...'}
            </p>
          </div>
        ) : (
          <TopicPicker onSelect={(t) => setSelected(t)} />
        )}

        {error && <p className="text-sm text-destructive text-center">{error}</p>}

        {selected && !loading && (
          <div className="sticky bottom-6">
            <button
              onClick={() => generate(selected)}
              className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-lg hover:opacity-90 transition-opacity cursor-pointer"
            >
              generate debate about "{selected.title.length > 50 ? selected.title.slice(0, 50) + '…' : selected.title}"
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
