import { useEffect, useRef, useState } from 'react'

interface Post {
  id: string
  title: string
  score: number
  url: string
  num_comments: number
}

interface Props {
  onSelect: (topic: string) => void
}

export default function TopicPicker({ onSelect }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/reddit/hot')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts))
      .catch(() => setError('failed to load posts'))
      .finally(() => setLoading(false))
  }, [])

  function select(topic: string) {
    setSelected(topic)
    setCustom('')
    onSelect(topic)
  }

  function handleCustomSubmit() {
    const t = custom.trim()
    if (t) select(t)
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">
      {/* custom input — claude-style chat input */}
      <div className="relative flex items-center rounded-2xl border border-border bg-card shadow-sm focus-within:border-ring transition-colors">
        <input
          ref={inputRef}
          type="text"
          placeholder="or enter a custom topic..."
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            setSelected(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleCustomSubmit()}
          className="flex-1 bg-transparent px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <button
          onClick={handleCustomSubmit}
          disabled={!custom.trim()}
          className="mr-2 flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-opacity cursor-pointer"
          aria-label="use this topic"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or pick from r/uwaterloo</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      {/* posts */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex flex-col gap-1.5">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => select(post.title)}
            className={`group text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
              selected === post.title
                ? 'border-primary/60 bg-primary/8 text-foreground'
                : 'border-transparent bg-muted/50 hover:bg-muted text-card-foreground'
            }`}
          >
            <p className="text-sm leading-snug line-clamp-2">{post.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              ↑ {post.score.toLocaleString()} · {post.num_comments} comments
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}
