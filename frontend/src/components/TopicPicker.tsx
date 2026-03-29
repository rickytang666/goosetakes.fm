import { useEffect, useRef, useState } from 'react'

interface Post {
  id: string
  title: string
  score: number
  url: string
  num_comments: number
  body?: string
  comments?: string[]
}

export interface SelectedTopic {
  title: string
  body?: string
  comments?: string[]
}

interface Props {
  onSelect: (topic: SelectedTopic) => void
}

const REDDIT_URL_RE = /reddit\.com\/r\/\w+\/comments\//

function isRedditUrl(s: string) {
  return REDDIT_URL_RE.test(s)
}

export default function TopicPicker({ onSelect }: Props) {
  const [posts, setPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [postsError, setPostsError] = useState<string | null>(null)

  const [keyword, setKeyword] = useState('')
  const [searchResults, setSearchResults] = useState<Post[] | null>(null)
  const [searching, setSearching] = useState(false)

  const [urlInput, setUrlInput] = useState('')
  const [urlLoading, setUrlLoading] = useState(false)
  const [urlError, setUrlError] = useState<string | null>(null)

  const [selected, setSelected] = useState<Post | null>(null)
  const [previewed, setPreviewed] = useState<Post | null>(null)

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch('/api/reddit/posts')
      .then((r) => r.json())
      .then((d) => setPosts(d.posts))
      .catch(() => setPostsError('failed to load posts'))
      .finally(() => setPostsLoading(false))
  }, [])

  useEffect(() => {
    if (!keyword.trim()) {
      setSearchResults(null)
      return
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(async () => {
      setSearching(true)
      try {
        const r = await fetch(`/api/reddit/search?q=${encodeURIComponent(keyword.trim())}`)
        const d = await r.json()
        setSearchResults(d.posts)
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 400)
  }, [keyword])

  async function handleUrlSubmit() {
    const url = urlInput.trim()
    if (!url) return
    if (!isRedditUrl(url)) {
      setUrlError('paste a reddit post URL (reddit.com/r/.../comments/...)')
      return
    }
    setUrlError(null)
    setUrlLoading(true)
    try {
      const r = await fetch(`/api/reddit/post?url=${encodeURIComponent(url)}`)
      if (!r.ok) throw new Error()
      const post: Post = await r.json()
      pick(post)
      setPreviewed(post)
    } catch {
      setUrlError('failed to fetch post')
    } finally {
      setUrlLoading(false)
    }
  }

  function pick(post: Post) {
    setSelected(post)
    onSelect({ title: post.title, body: post.body, comments: post.comments })
  }

  const displayedPosts = searchResults ?? posts
  const previewPost = previewed ?? selected

  return (
    <div className="flex flex-col gap-6 w-full max-w-2xl">

      {/* area 1 — keyword search */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">search r/uwaterloo</label>
        <div className="relative flex items-center rounded-2xl border border-border bg-card focus-within:border-ring transition-colors shadow-sm">
          <svg className="absolute left-3.5 text-muted-foreground w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="search for a topic..."
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setSelected(null) }}
            className="flex-1 bg-transparent pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          {searching && (
            <div className="mr-3 w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          )}
        </div>
      </div>

      {/* area 2 — url paste */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">paste a reddit link</label>
        <div className="flex gap-2">
          <div className="flex-1 flex items-center rounded-2xl border border-border bg-card focus-within:border-ring transition-colors shadow-sm">
            <svg className="ml-3.5 text-muted-foreground w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
              <path d="M6.5 9.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5L7.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M9.5 6.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              placeholder="https://reddit.com/r/uwaterloo/comments/..."
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
              className="flex-1 bg-transparent pl-2.5 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            onClick={handleUrlSubmit}
            disabled={!urlInput.trim() || urlLoading}
            className="px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed shrink-0"
          >
            {urlLoading ? '...' : 'fetch'}
          </button>
        </div>
        {urlError && <p className="text-xs text-destructive">{urlError}</p>}
      </div>

      {/* area 3 — post list + preview */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {searchResults ? `results for "${keyword}"` : 'hot & new posts'}
        </label>

        <div className="flex gap-3 items-start">
          {/* post list */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0 max-h-96 overflow-y-auto pr-1">
            {postsLoading && !searchResults && (
              [...Array(8)].map((_, i) => (
                <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
              ))
            )}

            {postsError && <p className="text-sm text-destructive">{postsError}</p>}
            {searchResults?.length === 0 && (
              <p className="text-sm text-muted-foreground">no results found</p>
            )}

            {displayedPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => pick(post)}
                onMouseEnter={() => setPreviewed(post)}
                onMouseLeave={() => setPreviewed(selected)}
                className={`group text-left px-3 py-2.5 rounded-xl border transition-all cursor-pointer ${
                  selected?.id === post.id
                    ? 'border-primary/60 bg-primary/8 text-foreground'
                    : 'border-transparent bg-muted/50 hover:bg-muted text-card-foreground'
                }`}
              >
                <p className="text-xs leading-snug line-clamp-2">{post.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ↑ {post.score.toLocaleString()} · {post.num_comments} comments
                </p>
              </button>
            ))}
          </div>

          {/* preview panel */}
          <div className="w-52 shrink-0 sticky top-0">
            {previewPost ? (
              <div className="rounded-xl border border-border bg-card p-3 flex flex-col gap-2">
                <p className="text-xs font-medium text-foreground leading-snug">{previewPost.title}</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span>↑ {previewPost.score.toLocaleString()}</span>
                  <span>·</span>
                  <span>{previewPost.num_comments} comments</span>
                </div>
                {previewPost.body && (
                  <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-2 line-clamp-6">
                    {previewPost.body}
                  </p>
                )}
                {previewPost.comments && previewPost.comments.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-border pt-2">
                    <p className="text-xs font-medium text-muted-foreground">top comments</p>
                    {previewPost.comments.slice(0, 3).map((c, i) => (
                      <p key={i} className="text-xs text-muted-foreground leading-relaxed line-clamp-2 pl-2 border-l border-border">
                        {c}
                      </p>
                    ))}
                  </div>
                )}
                {!previewPost.body && (!previewPost.comments || previewPost.comments.length === 0) && (
                  <p className="text-xs text-muted-foreground italic">no body text</p>
                )}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border p-3">
                <p className="text-xs text-muted-foreground">hover a post to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
