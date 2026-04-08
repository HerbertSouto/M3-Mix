# Guia de deploy

## Pré-requisitos

- Node.js 20+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (gerenciador de pacotes Python)
- Projeto no Supabase
- Conta no Vercel (frontend)
- Conta no Railway (backend)

## Variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto (nunca commite — está no `.gitignore`):

```bash
# Backend (Railway URL após o deploy)
FASTAPI_URL=https://seu-app.up.railway.app

# Segredo compartilhado entre Next.js e FastAPI
INTERNAL_API_SECRET=gere-um-segredo-longo-aqui

# CORS — origens permitidas no backend
ALLOWED_ORIGINS=https://m3mix.vercel.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# LLM (narrativa via Groq)
GROQ_API_KEY=gsk_...

# Chat (Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
```

## Banco de dados (Supabase)

Execute as migrations na ordem:

```sql
-- 1. Tabela principal de análises
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'processing',
  step TEXT,
  csv_url TEXT,
  channels TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Resultados
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

-- 4. RLS — apenas service role acessa os dados
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_rate_limits ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy de SELECT para anon = bloqueado automaticamente
```

No Storage, crie o bucket `csv-uploads` com acesso público para download.

## Frontend (Vercel)

```bash
cd frontend
npm install
```

No Vercel, conecte o repositório e configure:
- **Root Directory:** `frontend`
- **Environment Variables:** todas as variáveis do `.env` acima

## Backend (Railway)

```bash
cd backend
uv sync
```

No Railway, conecte o repositório e configure:
- **Root Directory:** `backend`
- **Start command:** `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:** `INTERNAL_API_SECRET`, `ALLOWED_ORIGINS`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `ANTHROPIC_API_KEY`

## Desenvolvimento local

```bash
# Frontend
cd frontend
npm install
npm run dev          # http://localhost:3000

# Backend (em outro terminal)
cd backend
uv sync
uv run uvicorn main:app --reload --port 8000
```

O `.env` na raiz é carregado automaticamente pelo backend (`python-dotenv`). O frontend lê as variáveis diretamente do ambiente.
