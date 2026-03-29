import { useState } from 'react'
import TopicPicker from './components/TopicPicker'

export default function App() {
  const [topic, setTopic] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-background flex flex-col items-center px-4 py-12 gap-8">
      <h1 className="text-4xl font-bold text-foreground tracking-tight">gooseTakes.fm</h1>
      <TopicPicker onSelect={setTopic} />
      {topic && (
        <div className="text-sm text-muted-foreground">
          selected: <span className="text-foreground font-medium">"{topic}"</span>
        </div>
      )}
    </div>
  )
}
