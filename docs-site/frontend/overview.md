# Frontend — Visão geral

O frontend é uma aplicação Next.js 16 com App Router, hospedada no Vercel.

## Estrutura de rotas

```
app/
├── page.tsx                        # Landing page
├── analysis/
│   └── [id]/
│       ├── page.tsx                # Relatório completo (server component)
│       └── optimize/
│           └── page.tsx            # Otimizador de budget (client component)
└── api/
    ├── upload/route.ts             # Recebe CSV, dispara análise
    ├── chat/route.ts               # Proxy SSE para o FastAPI
    ├── optimize/route.ts           # Proxy para /optimize no FastAPI
    └── analysis/[id]/
        ├── status/route.ts         # Polling de status da análise
        └── results/route.ts        # Leitura dos resultados (service role)
```

## Páginas principais

### Landing page (`/`)

- Upload de CSV ou XLSX (XLSX é convertido para CSV no servidor antes do upload)
- Preview das colunas detectadas com seleção dos canais de mídia
- Download do dataset de exemplo

### Relatório (`/analysis/[id]`)

Server Component — renderizado no servidor com o service role key.

Seções:
- **Métricas principais** — ROAS médio, receita total, número de canais
- **ROAS por canal** — barras horizontais com status (pode escalar / saturado)
- **Decomposição de receita** — área chart por semana mostrando contribuição de cada canal
- **Curvas de saturação** — linha por canal mostrando retorno marginal
- **Narrativa da IA** — relatório executivo gerado pelo Groq
- **Chat** — interface de perguntas e respostas sobre os resultados

### Otimizador (`/analysis/[id]/optimize`)

Client Component com estado local.

- Slider de budget total (50% a 200% do budget atual)
- Debounce de 400ms antes de chamar `/api/optimize`
- Barras comparativas: alocação atual vs. sugerida por canal
- Uplift projetado em receita

## Fluxo de upload

```
1. Usuário seleciona arquivo (CSV ou XLSX)
2. Frontend detecta colunas e pede confirmação dos canais *_spend
3. POST /api/upload com FormData { file, channels }
   → rate limit por IP (5/hora)
   → validação de tamanho (max 10MB)
   → conversão XLSX → CSV se necessário
   → upload para Supabase Storage
   → insert em analyses (status: processing)
   → POST /analyze no FastAPI (fire and forget)
4. Redirect para /analysis/[id]
5. Polling em /api/analysis/[id]/status a cada 3s
6. Quando status=completed, página carrega os dados
```

## Variáveis de ambiente

| Variável | Onde é usada | Escopo |
|----------|-------------|--------|
| `FASTAPI_URL` | API routes (server) | Privada |
| `INTERNAL_API_SECRET` | API routes (server) | Privada |
| `NEXT_PUBLIC_SUPABASE_URL` | Inicialização do client | Pública |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Inicialização do client | Pública |
| `SUPABASE_SERVICE_ROLE_KEY` | API routes (server) | Privada |
