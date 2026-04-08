# Deploy Guide

## Prerequisites

- Node.js 20+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Supabase project
- Vercel account (frontend)
- Railway account (backend)

## Environment variables

Create a `.env` file at the project root (never commit — it's in `.gitignore`):

```bash
# Backend (Railway URL after deploy)
FASTAPI_URL=https://your-app.up.railway.app

# Shared secret between Next.js and FastAPI
INTERNAL_API_SECRET=generate-a-long-secret-here

# CORS — allowed origins in the backend
ALLOWED_ORIGINS=https://your-app.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM — executive narrative and chat (Groq)
GROQ_API_KEY=gsk_...
```

## Database (Supabase)

Run the migrations in order:

```sql
-- 1. Main analyses table
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'processing',
  step TEXT,
  csv_url TEXT,
  channels TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Results
CREATE TABLE analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL REFERENCES analyses(id),
  roas JSONB,
  contributions JSONB,
  saturation JSONB,
  adstock JSONB,
  decomposition JSONB,
  budget_recommendation JSONB,
  ai_narrative TEXT,
  contribution_intervals JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Rate limits
CREATE TABLE chat_rate_limits (
  session_id TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE upload_rate_limits (
  ip TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RLS — only service role accesses data
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_rate_limits ENABLE ROW LEVEL SECURITY;
-- No SELECT policy for anon = blocked automatically
```

In Storage, create the `csv-uploads` bucket with public download access.

## Frontend (Vercel)

```bash
cd frontend
npm install
```

In Vercel, connect the repository and configure:
- **Root Directory:** `frontend`
- **Environment Variables:** all variables from the `.env` above

## Backend (Railway)

```bash
cd backend
uv sync
```

In Railway, connect the repository and configure:
- **Root Directory:** `backend`
- **Start command:** `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:** `INTERNAL_API_SECRET`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`

## Local development

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend (separate terminal)
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

The `.env` at the root is loaded automatically by the backend (`python-dotenv`). The frontend reads variables directly from the environment.
