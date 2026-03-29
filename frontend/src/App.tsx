import { useState } from 'react'
import TopicPicker from './components/TopicPicker'

interface ScriptLine {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
}

interface Clip {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
  audio_url: string
}

const SPEAKER_COLOR: Record<string, string> = {
  TRUMP: 'text-red-400',
  ELON: 'text-blue-400',
  GORDON: 'text-orange-400',
}

type Stage = 'idle' | 'generating' | 'synthesizing'

export default function App() {
  const [topic, setTopic] = useState<string | null>(null)
  const [script, setScript] = useState<ScriptLine[] | null>(null)
  const [clips, setClips] = useState<Clip[] | null>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    if (!topic) return
    setError(null)
    setScript(null)
    setClips(null)

    // step 1: generate script
    setStage('generating')
    let generatedScript: ScriptLine[]
    try {
      const r = await fetch('/api/debate/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      })
      const d = await r.json()
      if (!r.ok) throw new Error(d.detail)
      generatedScript = d.script
      setScript(generatedScript)
    } catch (e: any) {
      setError(e.message ?? 'script generation failed')
      setStage('idle')
      return
    }

    // step 2: synthesize voices
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
    } catch (e: any) {
      setError(e.message ?? 'voice synthesis failed')
    } finally {
      setStage('idle')
    }
  }

  const busy = stage !== 'idle'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
      <h1 className="text-4xl font-bold text-foreground tracking-tight">gooseTakes.fm</h1>

      <TopicPicker onSelect={(t) => { setTopic(t); setScript(null); setClips(null) }} />

      {topic && (
        <button
          onClick={generate}
          disabled={busy}
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {stage === 'generating' ? 'writing script...' : stage === 'synthesizing' ? 'synthesizing voices...' : 'generate debate'}
        </button>
      )}

      {error && <p className="text-destructive text-sm">{error}</p>}

      {script && (
        <div className="flex flex-col gap-3 w-full max-w-2xl">
          {script.map((line, i) => (
            <div key={i} className="flex gap-3 items-start">
              <span className={`font-bold text-sm w-16 shrink-0 ${SPEAKER_COLOR[line.speaker]}`}>
                {line.speaker}
              </span>
              <p className="text-foreground text-sm">{line.line}</p>
              {clips?.[i] && (
                <audio controls src={`/api${clips[i].audio_url}`} className="h-6 ml-auto shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
