# MMM Tool — Design Spec
**Date:** 2026-04-01  
**Status:** Approved

---

## Overview

Uma ferramenta web para rodar Marketing Mix Modeling (MMM) Bayesiano, com dashboard interativo, otimização de budget e AI copilot que analisa e explica os resultados. Destinada a portfólio com uso real — qualquer pessoa pode subir um CSV e obter uma análise completa acessível por link permanente.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                   Next.js App Router                │
│  Upload CSV → Dashboard → Charts → AI Copilot Chat │
└───────────────────────┬─────────────────────────────┘
                        │ HTTP (REST)
┌───────────────────────▼─────────────────────────────┐
│                   FastAPI (Python)                  │
│                                                     │
│  /analyze   → PyMC-Marketing (Bayesian MMM)         │
│  /optimize  → scipy.optimize (budget allocation)    │
│  /chat      → Claude API (streaming)                │
└─────────────────────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────┐
│                     Supabase                        │
│  PostgreSQL (analyses, results, chat)               │
│  Storage (CSV uploads)                              │
└─────────────────────────────────────────────────────┘
```

**Deploy:**
- Frontend → Vercel
- FastAPI backend → Railway (container Python persistente)
- Database + Storage → Supabase
- Comunicação via env var `FASTAPI_URL` no Next.js

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js App Router + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| AI streaming | Vercel AI SDK |
| Backend | FastAPI (Python) |
| MMM | PyMC-Marketing |
| Otimização | scipy.optimize |
| AI | Claude API (Anthropic SDK) |
| Banco | Supabase (PostgreSQL) |
| Storage | Supabase Storage |

---

## Dados & Modelo

### Formato de entrada (CSV)

```
date, revenue, tv_spend, social_spend, search_spend, email_spend
2024-01-01, 150000, 20000, 8000, 12000, 1500
```

- Obrigatório: `date` + `revenue` + pelo menos 1 canal de mídia
- Colunas de canal são detectadas automaticamente (qualquer coluna terminando em `_spend`)
- Frequência: semanal ou mensal

### Outputs do modelo (PyMC-Marketing)

| Output | Descrição |
|---|---|
| ROAS por canal | Retorno sobre investimento por canal de mídia |
| Contribution % | % das vendas atribuída a cada canal vs. baseline orgânico |
| Curvas de saturação | Onde cada canal perde eficiência com mais investimento |
| Adstock decay | Por quanto tempo o efeito de um canal persiste após o gasto |
| Decomposição temporal | Vendas explicadas por canal ao longo do tempo |

### Budget optimizer (scipy.optimize)

- Entrada: budget total (ajustável via slider no frontend)
- Saída: alocação ótima por canal que maximiza revenue estimada
- Retorna: alocação atual vs. sugerida + ganho estimado em revenue

### AI Narrative (Claude)

Após o modelo rodar, Claude recebe os resultados estruturados e gera automaticamente:
- Resumo executivo (canal com melhor/pior performance)
- Red flags (ROAS < 1, canais saturados, anomalias)
- Recomendações de realocação explicadas em linguagem natural (pt-BR)

O chat fica disponível para perguntas livres sobre os resultados, com acesso ao contexto completo da análise.

---

## Frontend & UX

### Rotas

```
/                        → Landing + upload de CSV
/analysis/[id]           → Dashboard principal
/analysis/[id]/optimize  → Otimização de budget
```

### `/` — Landing & Upload

- Área de upload (drag & drop ou file picker)
- Preview das primeiras linhas do CSV após upload
- Botão "Rodar Análise" → cria registro e redireciona para `/analysis/[id]`

### `/analysis/[id]` — Dashboard

- **Estado de loading:** barra de progresso com status (uploading → fitting model → generating insights) enquanto o job roda no backend (~1-2 min)
- **Cards de resumo:** ROAS total, revenue incremental vs. baseline, canal top performer
- **Gráfico de decomposição:** área empilhada — contribuição de cada canal + baseline ao longo do tempo
- **Tabela de canais:** ROAS, contribution %, adstock decay, saturação atual (% do ponto ótimo)
- **Curvas de saturação:** uma curva por canal mostrando diminishing returns e ponto atual
- **Painel de AI:** narrativa automática gerada pelo Claude + chat para perguntas livres (streaming)

### `/analysis/[id]/optimize` — Budget Optimizer

- Slider de budget total ajustável
- Comparativo antes/depois por canal (barras lado a lado)
- Revenue estimada com nova alocação vs. atual
- Explicação em linguagem natural do raciocínio da IA

### Design

Utilizar a skill `frontend-design` na implementação para garantir UI distintiva e de alto nível. Evitar estética genérica. Comprometer com uma direção visual clara e executar com precisão.

---

## Persistência (Supabase)

### Schema

```sql
-- Uma análise por upload
analyses
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid()
  created_at   timestamp   DEFAULT now()
  status       text        CHECK (status IN ('processing', 'completed', 'failed'))
  csv_url      text        -- path no Supabase Storage
  channels     text[]      -- ['tv_spend', 'social_spend', ...]
  date_range   daterange

-- Resultados do modelo
analysis_results
  id                    uuid  PRIMARY KEY DEFAULT gen_random_uuid()
  analysis_id           uuid  REFERENCES analyses(id)
  roas                  jsonb   -- { tv_spend: 2.3, social_spend: 1.1, ... }
  contributions         jsonb   -- { tv_spend: 0.32, baseline: 0.45, ... }
  saturation            jsonb   -- curvas por canal { channel: [{x, y}, ...] }
  adstock               jsonb   -- { tv_spend: 0.7, ... } (decay rate)
  decomposition         jsonb   -- série temporal [{ date, channel, value }, ...]
  budget_recommendation jsonb   -- { current: {...}, suggested: {...}, uplift: N }
  ai_narrative          text    -- análise gerada pelo Claude

-- Histórico de chat
chat_messages
  id           uuid      PRIMARY KEY DEFAULT gen_random_uuid()
  analysis_id  uuid      REFERENCES analyses(id)
  role         text      CHECK (role IN ('user', 'assistant'))
  content      text
  created_at   timestamp DEFAULT now()
```

### Fluxo assíncrono

```
1. Usuário faz upload do CSV
2. Next.js: faz upload do CSV para Supabase Storage
3. Next.js: cria registro em analyses (status: 'processing')
4. Next.js: envia job para FastAPI /analyze com { analysis_id, csv_url }
5. FastAPI: roda PyMC-Marketing (~1-2 min)
6. FastAPI: salva resultados em analysis_results
7. FastAPI: atualiza analyses.status para 'completed'
8. Frontend: polling a cada 3s em /api/analysis/[id]/status até completed
9. Frontend: exibe dashboard com resultados
```

---

## Critérios de Sucesso

- [ ] Usuário consegue subir um CSV e receber análise completa em < 3 minutos
- [ ] Link `/analysis/{id}` funciona permanentemente e é compartilhável
- [ ] AI gera narrativa útil e responde perguntas sobre os resultados
- [ ] Budget optimizer mostra recomendação de realocação com ganho estimado
- [ ] UI é visualmente distinta e impressionante para portfólio
