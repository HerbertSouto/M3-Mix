# Architecture

## Component diagram

```
┌─────────────────────────────────────────────────────────┐
│                      User (browser)                     │
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
│      limits         │  │  │  Groq — LLaMA 3.3 70B    │  │
│                     │  │  │  (narrative + chat)       │  │
│                     │  │  └──────────────────────────┘  │
│  Storage            │  └────────────────────────────────┘
│  └── csv-uploads    │
└─────────────────────┘
```

## Architecture decisions

### Next.js as BFF (Backend for Frontend)

All calls to FastAPI and Supabase originate from Next.js API routes — never directly from the browser. This keeps `INTERNAL_API_SECRET` and `SUPABASE_SERVICE_ROLE_KEY` exclusively on the server.

`NEXT_PUBLIC_SUPABASE_ANON_KEY` is present in the environment but **is not used for any data reads**. There is no Supabase client on the browser side — `lib/supabase/client.ts` was removed after all reads were migrated to server-side API routes.

### Analysis as a background task

The `POST /analyze` endpoint returns immediately with `200 OK`. Processing (CSV download, model fitting, result extraction, narrative generation) runs as a background task in FastAPI. The frontend polls `/api/analysis/[id]/status` until the status changes to `completed` or `failed`.

This avoids HTTP timeouts for analyses that take 5–8 minutes.

### No user authentication

Access to an analysis is controlled by the `analysis_id` (UUID v4). Whoever has the link has access. RLS in Supabase blocks any read via anon key — all data flows through the service role on the server.

## Security

| Vector | Mitigation |
|--------|------------|
| Compute abuse (spam analyses) | Rate limit: 5 uploads/hour per IP via Supabase |
| Malicious / oversized files | Type validation + 10 MB cap on upload |
| Direct FastAPI access | `X-Internal-Token` required on all endpoints |
| Supabase data enumeration | RLS: anon key with no SELECT policies |
| Chat spam | Double rate limit: 30 msgs/session (backend) + 120 msgs/hour per IP (frontend) |
| Open CORS on backend | Explicit `ALLOWED_ORIGINS`; no wildcard `*` |
