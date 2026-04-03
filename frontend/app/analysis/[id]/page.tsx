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
    return (
      <main className="max-w-7xl mx-auto p-8">
        <StatusPoller analysisId={id} />
      </main>
    )
  }

  if (analysis.status === 'failed') {
    return (
      <main className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <p className="text-destructive font-medium">Análise falhou.</p>
          <Link href="/">
            <Button variant="outline">Tentar novamente</Button>
          </Link>
        </div>
      </main>
    )
  }

  const { data: results } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('analysis_id', id)
    .single()

  if (!results) notFound()

  const typedResults = results as AnalysisResults

  const createdAt = new Date(analysis.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  return (
    <main className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Relatório de Mix de Mídia
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Análise MMM</h1>
          <p className="text-sm text-muted-foreground">
            {analysis.channels.map((c: string) => (
              <span key={c} className="inline-flex items-center mr-2 capitalize">
                <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mr-1" />
                {c.replace('_spend', '')}
              </span>
            ))}
            <span className="ml-1 text-muted-foreground/60">· {createdAt}</span>
          </p>
        </div>
        <Link href={`/analysis/${id}/optimize`}>
          <Button>Otimizar Budget →</Button>
        </Link>
      </div>

      <SummaryCards results={typedResults} />
      <NarrativePanel narrative={typedResults.ai_narrative} />
      <DecompositionChart decomposition={typedResults.decomposition} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChannelTable results={typedResults} />
        <SaturationCurves
          saturation={typedResults.saturation}
          channels={analysis.channels}
        />
      </div>

      <ChatPanel
        analysisId={id}
        analysisContext={{
          roas: typedResults.roas,
          contributions: typedResults.contributions,
          budget_recommendation: typedResults.budget_recommendation,
        }}
      />
    </main>
  )
}
