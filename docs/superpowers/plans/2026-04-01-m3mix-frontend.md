# M3-Mix Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Next.js App Router frontend that lets users upload CSV data, tracks async MMM analysis, and displays an interactive dashboard with charts, budget optimizer, and AI chat.

**Architecture:** Next.js App Router with server components for data fetching from Supabase and client components for interactive charts and streaming chat. Three routes: `/` (upload), `/analysis/[id]` (dashboard), `/analysis/[id]/optimize` (budget optimizer). Supabase handles persistence; FastAPI backend handles computation.

**Tech Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, shadcn/ui, Recharts, Vercel AI SDK, @supabase/supabase-js

---

## File Structure

```
frontend/
  package.json
  next.config.ts
  tailwind.config.ts
  components.json                       # shadcn/ui config
  app/
    layout.tsx                          # root layout, fonts, global styles
    page.tsx                            # landing + CSV upload
    analysis/
      [id]/
        page.tsx                        # dashboard (server component, fetches from Supabase)
        optimize/
          page.tsx                      # budget optimizer page
  components/
    upload/
      UploadZone.tsx                    # drag-and-drop CSV upload
      CsvPreview.tsx                    # preview first 5 rows
    dashboard/
      StatusPoller.tsx                  # polls /api/analysis/[id]/status, redirects on complete
      SummaryCards.tsx                  # ROAS total, top channel, incremental revenue
      DecompositionChart.tsx            # stacked area chart — contribution by channel over time
      ChannelTable.tsx                  # table: ROAS, contribution %, adstock, saturation %
      SaturationCurves.tsx              # line charts — one per channel showing diminishing returns
    ai/
      NarrativePanel.tsx                # displays AI narrative from analysis_results
      ChatPanel.tsx                     # streaming chat with AI copilot
    optimize/
      BudgetSlider.tsx                  # total budget slider
      AllocationComparison.tsx          # before/after bar chart per channel
  lib/
    supabase/
      client.ts                         # browser Supabase client
      server.ts                         # server Supabase client (service role)
    api.ts                              # FastAPI client (triggerAnalysis, runOptimize)
    types.ts                            # shared TypeScript types
  app/api/
    upload/route.ts                     # POST: upload CSV to Supabase Storage, create analysis record
    analysis/[id]/status/route.ts       # GET: return analysis status from Supabase
    optimize/route.ts                   # POST: proxy to FastAPI /optimize
    chat/route.ts                       # POST: proxy to FastAPI /chat (SSE)
```

---

## Task 1: Scaffold Next.js project

**Files:**
- Create: `frontend/` (entire project)

- [ ] **Step 1: Create Next.js app**

```bash
cd C:/Users/herbe/OneDrive/Documentos/Workspace/M3
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-turbopack
cd frontend
```

- [ ] **Step 2: Install dependencies**

```bash
npm install @supabase/supabase-js ai @anthropic-ai/sdk recharts
npm install @radix-ui/react-slider @radix-ui/react-progress
```

- [ ] **Step 3: Initialize shadcn/ui**

```bash
npx shadcn@latest init
# Choose: Default style, Slate base color, CSS variables
```

- [ ] **Step 4: Add shadcn components used in the project**

```bash
npx shadcn@latest add card table badge progress slider button
```

- [ ] **Step 5: Verify dev server starts**

```bash
npm run dev
# Expected: http://localhost:3000 renders Next.js default page
```

- [ ] **Step 6: Commit**

```bash
cd ..
git add frontend/
git commit -m "feat: scaffold Next.js frontend with shadcn/ui"
```

---

## Task 2: Shared types and Supabase clients

**Files:**
- Create: `frontend/lib/types.ts`
- Create: `frontend/lib/supabase/client.ts`
- Create: `frontend/lib/supabase/server.ts`

- [ ] **Step 1: Create shared types**

```typescript
// frontend/lib/types.ts

export type AnalysisStatus = 'processing' | 'completed' | 'failed'

export interface Analysis {
  id: string
  created_at: string
  status: AnalysisStatus
  csv_url: string
  channels: string[]
  date_range: string | null
}

export interface SaturationPoint {
  x: number
  y: number
}

export interface DecompositionPoint {
  date: string
  channel: string
  value: number
}

export interface BudgetRecommendation {
  current_allocation: Record<string, number>
  suggested_allocation: Record<string, number>
  current_revenue_estimate: number
  suggested_revenue_estimate: number
  uplift_percent: number
}

export interface AnalysisResults {
  id: string
  analysis_id: string
  roas: Record<string, number>
  contributions: Record<string, number>
  saturation: Record<string, SaturationPoint[]>
  adstock: Record<string, number>
  decomposition: DecompositionPoint[]
  budget_recommendation: BudgetRecommendation
  ai_narrative: string
}
```

- [ ] **Step 2: Create browser Supabase client**

```typescript
// frontend/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 3: Create server Supabase client**

```typescript
// frontend/lib/supabase/server.ts
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}
```

- [ ] **Step 4: Install @supabase/ssr**

```bash
cd frontend && npm install @supabase/ssr
```

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/
git commit -m "feat: shared types and Supabase browser/server clients"
```

---

## Task 3: Supabase schema migration

**Files:**
- Create: `supabase/migrations/001_initial.sql`

- [ ] **Step 1: Create migration file**

```bash
mkdir -p supabase/migrations
```

```sql
-- supabase/migrations/001_initial.sql

create table analyses (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  status       text not null check (status in ('processing', 'completed', 'failed')),
  csv_url      text not null,
  channels     text[] not null default '{}',
  date_range   daterange
);

create table analysis_results (
  id                     uuid primary key default gen_random_uuid(),
  analysis_id            uuid references analyses(id) on delete cascade,
  roas                   jsonb not null default '{}',
  contributions          jsonb not null default '{}',
  saturation             jsonb not null default '{}',
  adstock                jsonb not null default '{}',
  decomposition          jsonb not null default '[]',
  budget_recommendation  jsonb not null default '{}',
  ai_narrative           text not null default ''
);

create table chat_messages (
  id           uuid primary key default gen_random_uuid(),
  analysis_id  uuid references analyses(id) on delete cascade,
  role         text not null check (role in ('user', 'assistant')),
  content      text not null,
  created_at   timestamptz default now()
);

-- Enable public read on analyses and results (analyses are public by UUID)
alter table analyses enable row level security;
alter table analysis_results enable row level security;
alter table chat_messages enable row level security;

create policy "Public read analyses" on analyses for select using (true);
create policy "Public read results" on analysis_results for select using (true);
create policy "Public read chat" on chat_messages for select using (true);
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Go to Supabase Dashboard → SQL Editor → paste and run the migration above.

- [ ] **Step 3: Create Storage bucket**

In Supabase Dashboard → Storage → New bucket: `csv-uploads`, public: false.

- [ ] **Step 4: Add Storage policy for upload via service role**

This is handled server-side via service role key — no additional policy needed.

- [ ] **Step 5: Commit migration file**

```bash
git add supabase/
git commit -m "feat: Supabase schema migration for analyses, results, and chat"
```

---

## Task 4: API routes

**Files:**
- Create: `frontend/app/api/upload/route.ts`
- Create: `frontend/app/api/analysis/[id]/status/route.ts`
- Create: `frontend/app/api/optimize/route.ts`
- Create: `frontend/app/api/chat/route.ts`
- Create: `frontend/lib/api.ts`

- [ ] **Step 1: Create upload route**

```typescript
// frontend/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const channels = JSON.parse(formData.get('channels') as string) as string[]

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const supabase = createServerClient()

  // Upload CSV to Supabase Storage
  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('csv-uploads')
    .upload(filename, bytes, { contentType: 'text/csv' })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('csv-uploads')
    .getPublicUrl(filename)

  // Create analysis record
  const { data: analysis, error: dbError } = await supabase
    .from('analyses')
    .insert({ status: 'processing', csv_url: publicUrl, channels })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  // Trigger FastAPI analysis job
  await fetch(`${process.env.FASTAPI_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysis_id: analysis.id,
      csv_url: publicUrl,
      channels,
    }),
  })

  return NextResponse.json({ analysis_id: analysis.id })
}
```

- [ ] **Step 2: Create status route**

```typescript
// frontend/app/api/analysis/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('analyses')
    .select('id, status')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ analysis_id: data.id, status: data.status })
}
```

- [ ] **Step 3: Create optimize route**

```typescript
// frontend/app/api/optimize/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const response = await fetch(`${process.env.FASTAPI_URL}/optimize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
```

- [ ] **Step 4: Create chat route (SSE proxy)**

```typescript
// frontend/app/api/chat/route.ts
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const response = await fetch(`${process.env.FASTAPI_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

- [ ] **Step 5: Create frontend API client**

```typescript
// frontend/lib/api.ts

export async function uploadCsv(file: File, channels: string[]): Promise<{ analysis_id: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('channels', JSON.stringify(channels))
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function getAnalysisStatus(id: string): Promise<{ status: string }> {
  const res = await fetch(`/api/analysis/${id}/status`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}
```

- [ ] **Step 6: Commit**

```bash
git add frontend/app/api/ frontend/lib/api.ts
git commit -m "feat: Next.js API routes for upload, status, optimize, and chat"
```

---

## Task 5: Upload page

**Files:**
- Modify: `frontend/app/page.tsx`
- Create: `frontend/components/upload/UploadZone.tsx`
- Create: `frontend/components/upload/CsvPreview.tsx`

- [ ] **Step 1: Create UploadZone component**

```tsx
// frontend/components/upload/UploadZone.tsx
'use client'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onFile: (file: File, headers: string[]) => void
}

export function UploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const firstLine = (e.target?.result as string).split('\n')[0]
      const headers = firstLine.split(',').map(h => h.trim())
      onFile(file, headers)
    }
    reader.readAsText(file)
  }, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      <p className="text-muted-foreground mb-4">Arraste um arquivo CSV aqui</p>
      <p className="text-xs text-muted-foreground mb-6">
        Colunas obrigatórias: <code>date</code>, <code>revenue</code>, e pelo menos um canal <code>*_spend</code>
      </p>
      <label>
        <Button variant="outline" asChild>
          <span>Selecionar arquivo</span>
        </Button>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </label>
    </div>
  )
}
```

- [ ] **Step 2: Create CsvPreview component**

```tsx
// frontend/components/upload/CsvPreview.tsx
'use client'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface Props {
  headers: string[]
  onAnalyze: (channels: string[]) => void
  loading: boolean
}

export function CsvPreview({ headers, onAnalyze, loading }: Props) {
  const detectedChannels = headers.filter(h => h.endsWith('_spend'))
  const [selected, setSelected] = useState<string[]>(detectedChannels)

  const toggle = (ch: string) =>
    setSelected(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium mb-2">Colunas detectadas</p>
        <div className="flex flex-wrap gap-2">
          {headers.map(h => (
            <Badge
              key={h}
              variant={selected.includes(h) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => h.endsWith('_spend') && toggle(h)}
            >
              {h}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selected.length} canais selecionados para análise
        </p>
      </div>
      <Button
        onClick={() => onAnalyze(selected)}
        disabled={selected.length === 0 || loading}
        className="w-full"
      >
        {loading ? 'Enviando...' : 'Rodar análise MMM'}
      </Button>
    </div>
  )
}
```

- [ ] **Step 3: Create upload page**

```tsx
// frontend/app/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/UploadZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { uploadCsv } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File, h: string[]) => {
    setFile(f)
    setHeaders(h)
    setError(null)
  }

  const handleAnalyze = async (channels: string[]) => {
    if (!file) return
    setLoading(true)
    try {
      const { analysis_id } = await uploadCsv(file, channels)
      router.push(`/analysis/${analysis_id}`)
    } catch (e) {
      setError('Erro ao enviar arquivo. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 max-w-2xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">M3-Mix</h1>
        <p className="text-muted-foreground text-lg">
          Marketing Mix Modeling com IA — suba seus dados e descubra o que realmente gera receita
        </p>
      </div>
      {!file ? (
        <UploadZone onFile={handleFile} />
      ) : (
        <div className="w-full space-y-4">
          <p className="text-sm text-muted-foreground">Arquivo: <strong>{file.name}</strong></p>
          <CsvPreview headers={headers} onAnalyze={handleAnalyze} loading={loading} />
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-4">{error}</p>}
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/app/page.tsx frontend/components/upload/
git commit -m "feat: upload page with drag-and-drop CSV and channel selection"
```

---

## Task 6: Status poller + dashboard shell

**Files:**
- Create: `frontend/components/dashboard/StatusPoller.tsx`
- Create: `frontend/app/analysis/[id]/page.tsx`

- [ ] **Step 1: Create StatusPoller**

```tsx
// frontend/components/dashboard/StatusPoller.tsx
'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { getAnalysisStatus } from '@/lib/api'

interface Props {
  analysisId: string
}

const STATUS_MESSAGES = {
  processing: 'Rodando modelo Bayesiano... isso pode levar 1-2 minutos',
}

export function StatusPoller({ analysisId }: Props) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      const { status } = await getAnalysisStatus(analysisId)
      if (status === 'completed') {
        clearInterval(interval)
        router.refresh()
      } else if (status === 'failed') {
        clearInterval(interval)
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [analysisId, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-full max-w-md space-y-4">
        <p className="text-center text-muted-foreground">{STATUS_MESSAGES.processing}</p>
        <Progress value={undefined} className="h-2 animate-pulse" />
        <p className="text-center text-xs text-muted-foreground">
          O modelo está amostrando distribuições posteriores via MCMC
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create dashboard page (server component)**

```tsx
// frontend/app/analysis/[id]/page.tsx
import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusPoller } from '@/components/dashboard/StatusPoller'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { DecompositionChart } from '@/components/dashboard/DecompositionChart'
import { ChannelTable } from '@/components/dashboard/ChannelTable'
import { SaturationCurves } from '@/components/dashboard/SaturationCurves'
import { NarrativePanel } from '@/components/ai/NarrativePanel'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { AnalysisResults } from '@/lib/types'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (!analysis) notFound()

  if (analysis.status === 'processing') {
    return <StatusPoller analysisId={id} />
  }

  if (analysis.status === 'failed') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">Análise falhou. Tente novamente.</p>
      </div>
    )
  }

  const { data: results } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('analysis_id', id)
    .single()

  if (!results) notFound()

  const typedResults = results as AnalysisResults

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Análise MMM</h1>
        <Link href={`/analysis/${id}/optimize`}>
          <Button variant="outline">Otimizar Budget →</Button>
        </Link>
      </div>
      <SummaryCards results={typedResults} />
      <NarrativePanel narrative={typedResults.ai_narrative} />
      <DecompositionChart decomposition={typedResults.decomposition} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChannelTable results={typedResults} />
        <SaturationCurves saturation={typedResults.saturation} channels={analysis.channels} />
      </div>
      <ChatPanel analysisId={id} analysisContext={{
        roas: typedResults.roas,
        contributions: typedResults.contributions,
        budget_recommendation: typedResults.budget_recommendation,
      }} />
    </main>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/dashboard/StatusPoller.tsx frontend/app/analysis/
git commit -m "feat: dashboard page with status poller and layout"
```

---

## Task 7: Dashboard components

**Files:**
- Create: `frontend/components/dashboard/SummaryCards.tsx`
- Create: `frontend/components/dashboard/DecompositionChart.tsx`
- Create: `frontend/components/dashboard/ChannelTable.tsx`
- Create: `frontend/components/dashboard/SaturationCurves.tsx`

- [ ] **Step 1: Create SummaryCards**

```tsx
// frontend/components/dashboard/SummaryCards.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

export function SummaryCards({ results }: Props) {
  const { roas, contributions } = results
  const topChannel = Object.entries(roas).sort((a, b) => b[1] - a[1])[0]
  const totalRoas = Object.values(roas).reduce((a, b) => a + b, 0) / Object.values(roas).length
  const incrementalShare = 1 - (contributions.baseline ?? 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">ROAS Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{totalRoas.toFixed(2)}x</p>
          <p className="text-xs text-muted-foreground mt-1">retorno médio por canal</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{topChannel?.[0].replace('_spend', '')}</p>
          <p className="text-xs text-muted-foreground mt-1">ROAS: {topChannel?.[1].toFixed(2)}x</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Receita Incremental</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{(incrementalShare * 100).toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">atribuída a mídia paga</p>
        </CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Create DecompositionChart**

```tsx
// frontend/components/dashboard/DecompositionChart.tsx
'use client'
import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { DecompositionPoint } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2']

interface Props {
  decomposition: DecompositionPoint[]
}

export function DecompositionChart({ decomposition }: Props) {
  const { chartData, channels } = useMemo(() => {
    const byDate: Record<string, Record<string, number>> = {}
    const channelSet = new Set<string>()
    for (const point of decomposition) {
      if (!byDate[point.date]) byDate[point.date] = { date: point.date as unknown as number }
      byDate[point.date][point.channel] = point.value
      channelSet.add(point.channel)
    }
    return {
      chartData: Object.values(byDate).sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      ),
      channels: Array.from(channelSet),
    }
  }, [decomposition])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Decomposição de Receita por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
            <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`} />
            <Legend />
            {channels.map((ch, i) => (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.6}
                name={ch.replace('_spend', '')}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create ChannelTable**

```tsx
// frontend/components/dashboard/ChannelTable.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

export function ChannelTable({ results }: Props) {
  const { roas, contributions, adstock } = results
  const channels = Object.keys(roas)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Canal</TableHead>
              <TableHead className="text-right">ROAS</TableHead>
              <TableHead className="text-right">Contribuição</TableHead>
              <TableHead className="text-right">Adstock</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {channels.map((ch) => (
              <TableRow key={ch}>
                <TableCell className="font-medium">{ch.replace('_spend', '')}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={roas[ch] >= 1 ? 'default' : 'destructive'}>
                    {roas[ch].toFixed(2)}x
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {((contributions[ch] ?? 0) * 100).toFixed(1)}%
                </TableCell>
                <TableCell className="text-right">
                  {((adstock[ch] ?? 0) * 100).toFixed(0)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 4: Create SaturationCurves**

```tsx
// frontend/components/dashboard/SaturationCurves.tsx
'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SaturationPoint } from '@/lib/types'

interface Props {
  saturation: Record<string, SaturationPoint[]>
  channels: string[]
}

export function SaturationCurves({ saturation, channels }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Curvas de Saturação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {channels.map((ch) => (
          <div key={ch}>
            <p className="text-sm font-medium mb-2">{ch.replace('_spend', '')}</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={saturation[ch] ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="x" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                <Tooltip
                  formatter={(v: number) => `${(v * 100).toFixed(1)}%`}
                  labelFormatter={(l) => `Spend: R$${Number(l).toLocaleString('pt-BR')}`}
                />
                <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add frontend/components/dashboard/
git commit -m "feat: dashboard components — summary cards, decomposition chart, channel table, saturation curves"
```

---

## Task 8: AI components

**Files:**
- Create: `frontend/components/ai/NarrativePanel.tsx`
- Create: `frontend/components/ai/ChatPanel.tsx`

- [ ] **Step 1: Create NarrativePanel**

```tsx
// frontend/components/ai/NarrativePanel.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  narrative: string
}

export function NarrativePanel({ narrative }: Props) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Análise do Copilot</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm">
          {narrative}
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 2: Create ChatPanel**

```tsx
// frontend/components/ai/ChatPanel.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  analysisId: string
  analysisContext: Record<string, unknown>
}

export function ChatPanel({ analysisId, analysisContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMessage = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis_id: analysisId, message: userMessage, analysis_context: analysisContext }),
    })

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let assistantContent = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const text = line.replace('data: ', '')
        if (text === '[DONE]') break
        assistantContent += text
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: assistantContent }
          return updated
        })
      }
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Pergunte ao Copilot</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="min-h-[200px] max-h-[400px] overflow-y-auto space-y-3 pr-2">
          {messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Pergunte sobre os resultados. Ex: "Qual canal devo aumentar o investimento?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Sua pergunta..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <Button onClick={send} disabled={loading || !input.trim()} size="sm">
            {loading ? '...' : 'Enviar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/components/ai/
git commit -m "feat: AI narrative panel and streaming chat copilot"
```

---

## Task 9: Budget optimizer page

**Files:**
- Create: `frontend/app/analysis/[id]/optimize/page.tsx`
- Create: `frontend/components/optimize/BudgetSlider.tsx`
- Create: `frontend/components/optimize/AllocationComparison.tsx`

- [ ] **Step 1: Create BudgetSlider**

```tsx
// frontend/components/optimize/BudgetSlider.tsx
'use client'
import { Slider } from '@/components/ui/slider'

interface Props {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function BudgetSlider({ value, min, max, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Budget total</span>
        <span className="font-semibold">
          R$ {value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={Math.round((max - min) / 100)}
        onValueChange={([v]) => onChange(v)}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>R$ {min.toLocaleString('pt-BR')}</span>
        <span>R$ {max.toLocaleString('pt-BR')}</span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create AllocationComparison**

```tsx
// frontend/components/optimize/AllocationComparison.tsx
'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface Props {
  current: Record<string, number>
  suggested: Record<string, number>
}

export function AllocationComparison({ current, suggested }: Props) {
  const channels = Object.keys(current)
  const data = channels.map(ch => ({
    name: ch.replace('_spend', ''),
    Atual: Math.round(current[ch]),
    Sugerido: Math.round(suggested[ch] ?? 0),
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alocação por Canal</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR')}`} />
            <Legend />
            <Bar dataKey="Atual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sugerido" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
```

- [ ] **Step 3: Create optimize page**

```tsx
// frontend/app/analysis/[id]/optimize/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BudgetSlider } from '@/components/optimize/BudgetSlider'
import { AllocationComparison } from '@/components/optimize/AllocationComparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnalysisResults, BudgetRecommendation } from '@/lib/types'
import Link from 'next/link'

export default function OptimizePage() {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [budget, setBudget] = useState(0)
  const [optimized, setOptimized] = useState<BudgetRecommendation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('analysis_results').select('*').eq('analysis_id', id).single()
      .then(({ data }) => {
        if (data) {
          setResults(data as AnalysisResults)
          const currentTotal = Object.values(data.budget_recommendation.current_allocation as Record<string, number>).reduce((a, b) => a + b, 0)
          setBudget(currentTotal)
          setOptimized(data.budget_recommendation as BudgetRecommendation)
        }
      })
  }, [id])

  const runOptimize = async (newBudget: number) => {
    if (!results) return
    setLoading(true)
    const res = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: id,
        total_budget: newBudget,
        current_allocation: results.budget_recommendation.current_allocation,
        roas: results.roas,
      }),
    })
    const data = await res.json()
    setOptimized(data)
    setLoading(false)
  }

  const handleBudgetChange = (v: number) => {
    setBudget(v)
    runOptimize(v)
  }

  if (!results || !optimized) return <div className="p-8 text-muted-foreground">Carregando...</div>

  const currentTotal = Object.values(optimized.current_allocation).reduce((a, b) => a + b, 0)

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link href={`/analysis/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Voltar ao dashboard
        </Link>
        <h1 className="text-2xl font-bold">Otimizador de Budget</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Ajuste o Budget Total</CardTitle></CardHeader>
        <CardContent>
          <BudgetSlider
            value={budget}
            min={currentTotal * 0.5}
            max={currentTotal * 2}
            onChange={handleBudgetChange}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Estimada Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              R$ {optimized.current_revenue_estimate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Estimada Otimizada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                R$ {optimized.suggested_revenue_estimate.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
              </p>
              <Badge variant={optimized.uplift_percent > 0 ? 'default' : 'destructive'}>
                {optimized.uplift_percent > 0 ? '+' : ''}{optimized.uplift_percent.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <AllocationComparison
        current={optimized.current_allocation}
        suggested={optimized.suggested_allocation}
      />

      {loading && <p className="text-sm text-muted-foreground text-center">Recalculando...</p>}
    </main>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/components/optimize/ frontend/app/analysis/
git commit -m "feat: budget optimizer page with interactive slider and allocation comparison"
```

---

## Task 10: Vercel deploy config

**Files:**
- Create: `frontend/.env.local` (not committed — already in .gitignore)
- Modify: `frontend/next.config.ts`

- [ ] **Step 1: Update next.config.ts**

```typescript
// frontend/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['localhost:3000'] },
  },
}

export default nextConfig
```

- [ ] **Step 2: Copy env vars for local dev**

```bash
cp .env .env.local
# Fill in actual values from Supabase dashboard and Railway
```

- [ ] **Step 3: Run full local test**

```bash
cd frontend && npm run build
# Expected: no TypeScript errors, successful build
npm run dev
# Upload a CSV → should redirect to /analysis/[id] → poll → show dashboard
```

- [ ] **Step 4: Deploy to Vercel**

```bash
# From project root
vercel --cwd frontend
# Add env vars in Vercel dashboard:
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, FASTAPI_URL, ANTHROPIC_API_KEY
```

- [ ] **Step 5: Final commit**

```bash
git add frontend/next.config.ts
git commit -m "chore: Next.js config and Vercel deploy setup"
git push
```
