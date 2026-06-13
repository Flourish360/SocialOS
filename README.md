# SocialOS — AI Social Media Management Platform

A full-stack AI-powered social media management platform built with Next.js 14, FastAPI, and SQLite/PostgreSQL.

## Features

- **Compose** — AI caption generator, tone selector, hashtag groups, post templates, multi-platform scheduling
- **Post Queue** — Smart queue that auto-distributes posts at peak engagement times
- **Calendar** — Month and week views with post management
- **Analytics** — Engagement charts, per-post analytics breakdown, CSV export, NL queries
- **Inbox** — Unified DM/comment inbox with AI reply suggestions
- **Competitors** — Track and benchmark competitor accounts
- **Media Library** — Asset management with drag-and-drop upload
- **Automation** — If/then workflow rules (triggers + actions)
- **AI Assistant** — Chat panel (⌘K) for any social media question
- **Settings** — Platform connections, accent color theming, brand kit

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, Recharts |
| Backend | Python FastAPI, SQLAlchemy, JWT auth (python-jose + bcrypt) |
| Database | SQLite (dev) / PostgreSQL (production) |
| AI | OpenAI GPT-4o (optional — mock responses if no key) |

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+

### Backend

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy env file and configure
cp .env.example .env
# Edit .env — at minimum set SECRET_KEY

# Run
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register an account and you're in.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `SECRET_KEY` | Yes | JWT signing secret — generate with `openssl rand -hex 32` |
| `DATABASE_URL` | No | Defaults to SQLite. Set PostgreSQL URL for production |
| `USE_MOCK_DATA` | No | `true` uses in-memory mock data (default). `false` writes to DB |
| `OPENAI_API_KEY` | No | Enables real AI features. Mock responses used if blank |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_S3_BUCKET` | No | S3/R2 for media uploads |

See `backend/.env.example` for all variables including social platform OAuth keys.

### Frontend (`frontend/.env.local`)

No configuration needed for local dev — the Next.js rewrite proxy handles API routing automatically.

## Project Structure

```
social-platform/
├── backend/
│   ├── app/
│   │   ├── api/          # Route handlers (auth, posts, analytics, ai, automation)
│   │   ├── core/         # Config, security utilities
│   │   ├── db/           # SQLAlchemy engine + session
│   │   ├── mock/         # Mock data for USE_MOCK_DATA=true
│   │   ├── models/       # SQLAlchemy ORM models
│   │   └── schemas/      # Pydantic request/response schemas
│   └── requirements.txt
└── frontend/
    ├── app/
    │   ├── (auth)/       # Login, register pages
    │   └── (dashboard)/  # All dashboard pages
    ├── components/       # Shared UI components
    ├── lib/              # API client, utilities
    └── store/            # Zustand state (auth, UI)
```

## Switching to Production Mode

1. Set `USE_MOCK_DATA=false` in `backend/.env`
2. Set a strong `SECRET_KEY`
3. Set `DATABASE_URL` to a PostgreSQL connection string
4. Run `uvicorn app.main:app` — tables are created automatically on startup

## License

MIT
