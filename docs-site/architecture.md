# Arquitetura

## Diagrama de componentes

```
┌─────────────────────────────────────────────────────────┐
│                      Usuário (browser)                  │
└────────────────────────┬────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────┐
│              Next.js (Vercel) — m3mix.vercel.app        │
│                                                         │
│  /app                    /app/api                       │
│  ├── page.tsx            ├── upload/route.ts            │
│  ├── analysis/[id]/      ├── analysis/[id]/             │
│  │   ├── page.tsx        │   ├── status/route.ts        │
│  │   └── optimize/       │   └── results/route.ts       │
│  └── ...                 ├── chat/route.ts              │
│                          └── optimize/route.ts          │
└──────────┬──────────────────────────┬───────────────────┘
           │ service role key          │ X-Internal-Token
           │                          │ (server → server)
┌──────────▼──────────┐  ┌───────────▼───────────────────┐
│  Supabase           │  │  FastAPI (Railway)             │
│                     │  │                                │
│  PostgreSQL         │  │  POST /analyze  (background)   │
│  ├── analyses       │  │  POST /optimize                │
│  ├── analysis_      │  │  POST /chat  (SSE stream)      │
│  │   results        │  │  GET  /health                  │
│  ├── chat_rate_     │  │                                │
│  │   limits         │  │  ┌──────────────────────────┐  │
│  └── upload_rate_   │  │  │  PyMC-Marketing          │  │
│      limits         │  │  │  + Groq (LLaMA 3.3 70B)  │  │
│                     │  │  └──────────────────────────┘  │
│  Storage            │  └────────────────────────────────┘
│  └── csv-uploads    │
└─────────────────────┘
```

## Decisões de arquitetura

### Next.js como BFF (Backend for Frontend)

Todas as chamadas ao FastAPI e ao Supabase partem dos API routes do Next.js — nunca direto do browser. Isso mantém `INTERNAL_API_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` exclusivamente no servidor.

O `NEXT_PUBLIC_SUPABASE_ANON_KEY` está no env mas **não é usado em nenhuma leitura de dados**. Não existe cliente Supabase no lado do browser — o `lib/supabase/client.ts` foi removido após a migração de todas as leituras para API routes server-side.

### Análise como background task

O endpoint `POST /analyze` retorna imediatamente com `202 Accepted`. O processamento (download do CSV, fitting do modelo, extração de resultados, geração de narrativa) roda em background task no FastAPI. O frontend faz polling em `/api/analysis/[id]/status` até o status mudar para `completed` ou `failed`.

Isso evita timeout HTTP nas análises que levam 5–8 minutos.

### Sem auth de usuário

O acesso a uma análise é controlado pelo `analysis_id` (UUID v4). Quem tem o link tem acesso. RLS no Supabase bloqueia qualquer leitura via anon key — todos os dados passam pelo service role no servidor.

## Segurança

| Vetor | Mitigação |
|-------|-----------|
| Abuso de compute (spam de análises) | Rate limit: 5 uploads/hora por IP via Supabase |
| Arquivo malicioso/gigante | Validação de tipo + cap de 10 MB no upload |
| Acesso direto ao FastAPI | `X-Internal-Token` obrigatório em todos os endpoints |
| Enumeração de dados no Supabase | RLS: anon key sem nenhuma policy de SELECT |
| Spam no chat | Rate limit duplo: 30 msgs/sessão (backend) + 120 msgs/hora por IP (frontend) |
| CORS aberto no backend | `ALLOWED_ORIGINS` explícito; sem wildcard `*` |
