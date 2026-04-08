# Visão geral

M3-Mix é uma aplicação web que leva Marketing Mix Modeling (MMM) para o dia a dia do gestor de marketing — sem exigir conhecimento técnico em estatística.

## O que a aplicação entrega

| Output | Descrição |
|--------|-----------|
| **ROAS por canal** | Retorno sobre investimento calculado a partir da contribuição real, sem viés de last-click |
| **Contribuição na receita** | Decomposição de quanto cada canal e a baseline explicam da receita total |
| **Curvas de saturação** | Retorno marginal por canal — identifica onde investir mais deixa de valer |
| **Adstock decay** | Efeito residual da mídia modelado semana a semana |
| **Narrativa executiva** | Relatório em linguagem natural gerado por LLM |
| **Otimização de budget** | Simulação de realocação entre canais para um budget total dado |

## Stack

| Camada | Tecnologia |
|--------|------------|
| Frontend | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI — narrativa | LLaMA 3.3 70B via Groq |
| AI — chat | Claude via Anthropic API |
| Backend | FastAPI (Python 3.11+) |
| MMM | PyMC-Marketing 0.x + PyMC |
| Otimização | scipy.optimize (SLSQP) |
| Banco de dados | Supabase (PostgreSQL + Storage) |
| Deploy frontend | Vercel |
| Deploy backend | Railway |

## Fluxo resumido

```
Usuário sobe CSV
      ↓
Next.js /api/upload
  → valida arquivo (tipo, tamanho, rate limit por IP)
  → faz upload para Supabase Storage
  → cria registro em analyses (status: processing)
  → dispara POST /analyze no FastAPI
      ↓
FastAPI (background task)
  → baixa o CSV
  → ajusta modelo MMM com PyMC-Marketing
  → extrai ROAS, contribuições, saturação, adstock
  → gera narrativa com Groq
  → salva results no Supabase
      ↓
Frontend polling /api/analysis/[id]/status
  → quando completed, renderiza relatório
```
