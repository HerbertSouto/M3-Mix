import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

export function SummaryCards({ results }: Props) {
  const { roas, contributions } = results
  const channels = Object.keys(roas)
  const topChannel = channels.sort((a, b) => roas[b] - roas[a])[0]
  const avgRoas = channels.reduce((s, ch) => s + roas[ch], 0) / channels.length
  const incrementalShare = 1 - (contributions.baseline ?? 0)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">ROAS Médio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{avgRoas.toFixed(2)}x</p>
          <p className="text-xs text-muted-foreground mt-1">retorno médio por canal</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold">{topChannel?.replace('_spend', '')}</p>
          <p className="text-xs text-muted-foreground mt-1">ROAS: {roas[topChannel]?.toFixed(2)}x</p>
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
