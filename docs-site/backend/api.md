# API Reference

O backend é uma API FastAPI rodando no Railway. Todos os endpoints exigem o header `X-Internal-Token` — chamadas sem ele recebem `403 Forbidden`. As chamadas partem exclusivamente dos API routes do Next.js.

**Base URL (produção):** configurada via `FASTAPI_URL` no Vercel.

---

## POST /analyze

Inicia uma análise MMM em background. Retorna imediatamente — o processamento leva 5–8 min.

### Request body

```json
{
  "analysis_id": "uuid-v4",
  "csv_url": "https://...supabase.co/storage/v1/object/public/csv-uploads/file.csv",
  "channels": ["tv_spend", "search_spend", "social_spend"]
}
```

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `analysis_id` | UUID v4 | ID gerado pelo Supabase no insert |
| `csv_url` | string | URL pública do arquivo no Supabase Storage |
| `channels` | string[] | Colunas de mídia selecionadas pelo usuário |

### Response `200`

```json
{ "analysis_id": "uuid-v4", "status": "processing" }
```

### Validações

- `csv_url` deve ter como origem o Supabase do projeto (validado pelo prefixo)
- `channels` não pode ser vazio e tem máximo de 20 itens
- Cada canal deve terminar com `_spend` e ser um identificador Python válido

### Background task

O FastAPI atualiza `analyses.step` em cada etapa:

| Step | Descrição |
|------|-----------|
| `downloading` | Baixando o CSV do Storage |
| `fitting` | Ajustando o modelo MMM (MCMC) |
| `extracting` | Calculando ROAS, contribuições, saturação, adstock |
| `optimizing` | Rodando o otimizador de budget (scipy) |
| `narrative` | Gerando narrativa com Groq |
| `saving` | Persistindo resultados no Supabase |
| `done` | Concluído |

Ao final, `analyses.status` muda para `completed`. Em caso de erro, para `failed`.

---

## POST /optimize

Calcula a alocação ótima de budget entre canais usando `scipy.optimize` (SLSQP).

### Request body

```json
{
  "analysis_id": "uuid-v4",
  "total_budget": 150000.0,
  "current_allocation": {
    "tv_spend": 80000,
    "search_spend": 40000,
    "social_spend": 30000
  },
  "roas": {
    "tv_spend": 1.1,
    "search_spend": 2.66,
    "social_spend": 3.01
  }
}
```

### Response `200`

```json
{
  "analysis_id": "uuid-v4",
  "current_allocation": { "tv_spend": 80000, "search_spend": 40000, "social_spend": 30000 },
  "suggested_allocation": { "tv_spend": 30000, "search_spend": 65000, "social_spend": 55000 },
  "current_revenue_estimate": 338500.0,
  "suggested_revenue_estimate": 401200.0,
  "uplift_percent": 18.5
}
```

---

## POST /chat

Stream de resposta do LLM (Server-Sent Events). O modelo recebe o contexto da análise e a mensagem do usuário.

### Request body

```json
{
  "analysis_id": "uuid-v4",
  "message": "Por que o TV tem ROAS tão baixo?",
  "session_id": "uuid-v4",     // opcional — UUID v4; habilita o rate limit por sessão
  "analysis_context": {
    "roas": { "tv_spend": 1.1, "search_spend": 2.66, "social_spend": 3.01 },
    "contributions": { "tv_spend": 0.18, "search_spend": 0.35, "social_spend": 0.28, "baseline": 0.19 }
  }
}
```

### Response `200` — SSE stream

```
data: Com base no modelo,

data: o canal TV apresenta

data: adstock elevado (decay lento),

data: [DONE]
```

### Rate limits

- `429` se `session_id` atingiu 30 mensagens
- `429` se IP atingiu 120 mensagens/hora

---

## GET /health

Endpoint de healthcheck — não exige `X-Internal-Token`.

```json
{ "status": "ok" }
```
