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
  TRUMP: 'text-red-400 border-red-400',
  ELON: 'text-blue-400 border-blue-400',
  GORDON: 'text-orange-400 border-orange-400',
}

export default function DebatePlayer({ clips }: Props) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({})

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

  // ensure all videos loop and play silently
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
    <div className="flex flex-col items-center gap-6 w-full max-w-2xl">
      {/* video panels */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {SPEAKERS.map((speaker) => (
          <div
            key={speaker}
            className={`relative rounded-xl overflow-hidden border-2 transition-all duration-150 ${
              activeSpeaker === speaker ? `border-current ${SPEAKER_COLOR[speaker]} scale-105` : 'border-transparent'
            }`}
          >
            <video
              ref={(el) => { videoRefs.current[speaker] = el }}
              src={`/videos/${speaker.toLowerCase()}.mp4`}
              className="w-full aspect-square object-cover"
              playsInline
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-center py-1">
              <span className={`text-xs font-bold ${SPEAKER_COLOR[speaker].split(' ')[0]}`}>
                {SPEAKER_LABEL[speaker]}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* controls */}
      <button
        onClick={playing ? stopDebate : startDebate}
        className="px-8 py-3 rounded-lg bg-primary text-primary-foreground font-semibold cursor-pointer"
      >
        {playing ? 'stop' : 'play debate'}
      </button>

      {/* transcript */}
      <div className="flex flex-col gap-2 w-full">
        {clips.map((clip, i) => (
          <div
            key={i}
            className={`flex gap-3 px-3 py-2 rounded-lg transition-colors ${
              currentIndex === i ? 'bg-muted' : ''
            }`}
          >
            <span className={`font-bold text-xs w-16 shrink-0 ${SPEAKER_COLOR[clip.speaker].split(' ')[0]}`}>
              {clip.speaker}
            </span>
            <p className={`text-sm ${currentIndex === i ? 'text-foreground' : 'text-muted-foreground'}`}>
              {clip.line}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
