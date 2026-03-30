<div align="center">

<img src="frontend/public/banner.png" width="300" alt="GooseTakes.fm" />

What if Trump, Elon Musk, and Gordon Ramsay argued about your university drama?

Now you don't have to wonder.

</div>

---

GooseTake.fm scrapes r/uwaterloo for hot and trendy posts, generates an AI debate script, clones their voices, and plays it back as a live panel show. Pick a topic and watch the chaos unfold.


https://github.com/user-attachments/assets/c462f7af-6cc8-41fd-aa92-ff15be82b80d



## Features

- **Reddit scraper** — Pulls hot & new posts from r/uwaterloo with score filtering, keyword search, and URL paste support
- **AI script generation** — Claude reads the actual post content and writes a punchy, specific debate script
- **Voice cloning** — Each line synthesized via Fish Audio with cloned celebrity voices
- **Live playback** — Video synced to whoever is speaking, with a scrolling transcript

## Setup

```bash
# Backend
cd backend && uv sync

# Frontend
cd ../frontend && npm install

# Env
cp .env.example .env  # fill in ANTHROPIC_API_KEY and FISH_AUDIO_API_KEY
```

Drop speaker video clips into `frontend/public/videos/` — `trump.mp4`, `elon.mp4`, `gordon.mp4`.

## How to Use

```bash
# Terminal 1
cd backend && uv run uvicorn main:app --reload

# Terminal 2
cd frontend && npm run dev
```

Open `localhost:5173`, pick a post or paste a Reddit URL, hit **Generate Debate**, press play.

## Stack

| Layer    | Tech                                 |
| -------- | ------------------------------------ |
| Frontend | React + Vite + TypeScript + Tailwind |
| Backend  | FastAPI + Python                     |
| LLM      | Claude (Anthropic)                   |
| TTS      | Fish Audio                           |
| Reddit   | Public JSON API (no auth)            |
