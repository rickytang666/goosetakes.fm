import { useEffect, useState } from 'react'

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

  return (
    <div className="flex flex-col gap-4 w-full max-w-2xl">
      <h2 className="text-2xl font-semibold text-foreground">pick a topic</h2>

      {loading && <p className="text-muted-foreground">loading r/uwaterloo...</p>}
      {error && <p className="text-destructive">{error}</p>}

      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <button
            key={post.id}
            onClick={() => select(post.title)}
            className={`text-left px-4 py-3 rounded-lg border transition-colors cursor-pointer ${
              selected === post.title
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card text-card-foreground hover:border-primary/50'
            }`}
          >
            <p className="text-sm font-medium leading-snug">{post.title}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {post.score} pts · {post.num_comments} comments
            </p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <input
          type="text"
          placeholder="or type a custom topic..."
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value)
            setSelected(null)
          }}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
        />
        <button
          onClick={() => custom.trim() && select(custom.trim())}
          disabled={!custom.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          use this
        </button>
      </div>
    </div>
  )
}
