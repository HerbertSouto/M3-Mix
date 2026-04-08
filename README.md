# M3-Mix

**Marketing Mix Modeling for marketers — without the statistics degree.**

Upload a CSV with your media spend data. Get Bayesian ROAS by channel, saturation curves, adstock decay, an AI-generated executive report, and an interactive budget optimizer — in 5–8 minutes.

[![Live App](https://img.shields.io/badge/app-m3mix.vercel.app-e4ff1a?style=flat&labelColor=07070f)](https://m3mix.vercel.app)
[![Docs](https://img.shields.io/badge/docs-herbertsouto.github.io/M3--Mix-e4ff1a?style=flat&labelColor=07070f)](https://herbertsouto.github.io/M3-Mix/)

<p align="center">
  <img src="assets/preview.png" alt="M3-Mix preview" width="600"/>
</p>

---

## What it does

- **Bayesian MMM** via PyMC-Marketing — ROAS by channel, revenue contribution, saturation curves, adstock decay
- **AI narrative** — LLaMA 3.3 70B reads your results and writes a structured executive report
- **Budget optimizer** — finds the allocation that maximizes estimated revenue for any total budget
- **Interactive chat** — ask questions about your results in plain language
- **Shareable links** — every analysis gets a permanent URL

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI (narrative + chat) | LLaMA 3.3 70B via Groq |
| Backend | FastAPI (Python 3.11+) |
| MMM | PyMC-Marketing + PyMC |
| Optimization | scipy.optimize (SLSQP) |
| Database | Supabase (PostgreSQL + Storage) |
| Deploy | Vercel (frontend) + Railway (backend) |

## CSV format

```
date,revenue,tv_spend,social_spend,search_spend
2024-01-07,150000,20000,8000,12000
```

Required columns: `date` (weekly, YYYY-MM-DD), `revenue`, and at least one `*_spend` column.  
XLSX files are also accepted — converted automatically on upload.

**Don't have data?** Download the [synthetic example dataset](https://m3mix.vercel.app) from the app.

## Quickstart

```bash
git clone https://github.com/HerbertSouto/M3-Mix.git
cd M3-Mix
cp .env.example .env   # fill in your keys

# Frontend
cd frontend && npm install && npm run dev

# Backend (separate terminal)
cd backend && uv sync && uv run uvicorn main:app --reload --port 8000
```

See the **[full setup guide →](https://herbertsouto.github.io/M3-Mix/deploy)** for Supabase migrations, environment variables, and production deploy instructions.

## Prerequisites

- Node.js 20+
- Python 3.11+ with [uv](https://docs.astral.sh/uv/)
- Supabase project
- Groq API key (free at [console.groq.com](https://console.groq.com))
