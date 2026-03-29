import { useEffect, useRef, useState } from 'react'

interface Clip {
  speaker: 'TRUMP' | 'ELON' | 'GORDON'
  line: string
  audio_url: string
}

interface Props {
  clips: Clip[]
}

const SPEAKERS = ['TRUMP', 'ELON', 'GORDON'] as const

const SPEAKER_LABEL: Record<string, string> = {
  TRUMP: 'Donald Trump',
  ELON: 'Elon Musk',
  GORDON: 'Gordon Ramsay',
}

const SPEAKER_COLOR: Record<string, string> = {
  TRUMP: 'text-red-400',
  ELON: 'text-blue-400',
  GORDON: 'text-orange-400',
}

const SPEAKER_BG: Record<string, string> = {
  TRUMP: 'bg-red-400/10 border-red-400/30',
  ELON: 'bg-blue-400/10 border-blue-400/30',
  GORDON: 'bg-orange-400/10 border-orange-400/30',
}

export default function DebatePlayer({ clips }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})
  const transcriptRef = useRef<HTMLDivElement>(null)

  const activeSpeaker = currentIndex !== null ? clips[currentIndex].speaker : null

  function playClip(index: number) {
    if (index >= clips.length) {
      setPlaying(false)
      setCurrentIndex(null)
      return
    }

    setCurrentIndex(index)

    const audio = new Audio(`/api${clips[index].audio_url}`)
    audioRef.current = audio
    audio.onended = () => playClip(index + 1)
    audio.play()
  }

  function startDebate() {
    audioRef.current?.pause()
    setPlaying(true)
    playClip(0)
  }

  function stopDebate() {
    audioRef.current?.pause()
    audioRef.current = null
    setPlaying(false)
    setCurrentIndex(null)
  }

  // scroll active transcript line into view
  useEffect(() => {
    if (currentIndex === null || !transcriptRef.current) return
    const el = transcriptRef.current.children[currentIndex] as HTMLElement
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [currentIndex])

  // all videos loop silently — only one is visible at a time
  useEffect(() => {
    SPEAKERS.forEach((s) => {
      const v = videoRefs.current[s]
      if (v) {
        v.loop = true
        v.muted = true
        v.play().catch(() => {})
      }
    })
    return () => { audioRef.current?.pause() }
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* video */}
      <div className="relative w-full rounded-2xl overflow-hidden bg-muted aspect-video">
        {SPEAKERS.map((speaker) => (
          <video
            key={speaker}
            ref={(el) => { videoRefs.current[speaker] = el }}
            src={`/videos/${speaker.toLowerCase()}.mp4`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${
              activeSpeaker === speaker ? 'opacity-100' : 'opacity-0'
            }`}
            playsInline
          />
        ))}

        {/* speaker badge */}
        {activeSpeaker && (
          <div className={`absolute bottom-3 left-3 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm ${SPEAKER_BG[activeSpeaker]} ${SPEAKER_COLOR[activeSpeaker]}`}>
            {SPEAKER_LABEL[activeSpeaker]}
          </div>
        )}

        {!activeSpeaker && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted-foreground text-sm">press play to start</p>
          </div>
        )}
      </div>

      {/* play/stop */}
      <button
        onClick={playing ? stopDebate : startDebate}
        className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity cursor-pointer"
      >
        {playing ? 'stop' : '▶  play debate'}
      </button>

      {/* transcript */}
      <div
        ref={transcriptRef}
        className="flex flex-col gap-1 max-h-64 overflow-y-auto pr-1"
      >
        {clips.map((clip, i) => (
          <div
            key={i}
            className={`flex gap-3 px-3 py-2.5 rounded-xl transition-colors ${
              currentIndex === i ? 'bg-muted' : ''
            }`}
          >
            <span className={`font-semibold text-xs w-14 shrink-0 pt-0.5 ${SPEAKER_COLOR[clip.speaker]}`}>
              {clip.speaker}
            </span>
            <p className={`text-sm leading-relaxed ${currentIndex === i ? 'text-foreground' : 'text-muted-foreground'}`}>
              {clip.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
