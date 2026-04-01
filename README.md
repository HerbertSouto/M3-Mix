# M3-Mix

Marketing Mix Modeling tool — upload your media spend data, get Bayesian MMM analysis, budget optimization recommendations, and AI-generated insights.

## What it does

- **Bayesian MMM** via PyMC-Marketing — ROAS by channel, contribution breakdown, saturation curves, adstock decay
- **Budget optimizer** — given a total budget, finds the allocation that maximizes estimated revenue
- **AI copilot** — automatic narrative analysis + free-form chat about your results
- **Shareable links** — every analysis gets a permanent URL

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI | Claude API + Vercel AI SDK |
| Backend | FastAPI (Python) |
| MMM | PyMC-Marketing |
| Optimization | scipy.optimize |
| Database | Supabase (PostgreSQL + Storage) |

## Getting started

### Prerequisites

- Node.js 20+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/)
- Supabase project
- Anthropic API key

### Setup

```bash
# Clone
git clone https://github.com/HerbertSouto/M3-Mix.git
cd M3-Mix

# Frontend
cd frontend
npm install
cp ../.env.example ../.env  # fill in your keys
npm run dev

# Backend
cd backend
uv sync
uv run uvicorn main:app --reload
```

### CSV format

```
date,revenue,tv_spend,social_spend,search_spend
2024-01-01,150000,20000,8000,12000
```

Required: `date`, `revenue`, and at least one `*_spend` column.

## Deploy

- Frontend → Vercel
- Backend → Railway
- Set env vars from `.env.example` in each platform
