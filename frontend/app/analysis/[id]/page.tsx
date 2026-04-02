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

  return (
    <main className="max-w-7xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Análise MMM</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Canais: {analysis.channels.map((c: string) => c.replace('_spend', '')).join(', ')}
          </p>
        </div>
        <Link href={`/analysis/${id}/optimize`}>
          <Button variant="outline">Otimizar Budget →</Button>
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
