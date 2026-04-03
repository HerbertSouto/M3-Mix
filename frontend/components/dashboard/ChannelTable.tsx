import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

const CHANNEL_COLORS: Record<string, string> = {
  tv:     'bg-blue-500',
  search: 'bg-emerald-500',
  social: 'bg-violet-500',
  radio:  'bg-amber-500',
  ooh:    'bg-rose-500',
}

function getColor(channel: string) {
  const key = channel.replace('_spend', '')
  return CHANNEL_COLORS[key] ?? 'bg-primary'
}

export function ChannelTable({ results }: Props) {
  const { roas, contributions, adstock } = results
  const channels = Object.keys(roas).sort((a, b) => roas[b] - roas[a])
  const maxContrib = Math.max(...channels.map(ch => contributions[ch] ?? 0))

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Performance por Canal</CardTitle>
        <p className="text-xs text-muted-foreground">ordenado por ROAS decrescente</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {channels.map((ch, i) => {
          const name = ch.replace('_spend', '')
          const roasVal = roas[ch]
          const contrib = (contributions[ch] ?? 0) * 100
          const adstockVal = (adstock[ch] ?? 0) * 100
          const barWidth = maxContrib > 0 ? ((contributions[ch] ?? 0) / maxContrib) * 100 : 0
          const color = getColor(ch)

          return (
            <div key={ch} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                  <span className={`w-2 h-2 rounded-full ${color}`} />
                  <span className="text-sm font-medium capitalize">{name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className={`font-bold tabular-nums ${roasVal >= 5 ? 'text-emerald-600 dark:text-emerald-400' : roasVal >= 2 ? 'text-foreground' : 'text-amber-600'}`}>
                    {roasVal.toFixed(2)}x
                  </span>
                  <span className="text-muted-foreground tabular-nums w-12 text-right">
                    {contrib.toFixed(1)}%
                  </span>
                  {adstockVal > 0 && (
                    <span className="text-muted-foreground/60 tabular-nums w-14 text-right text-xs">
                      α {adstockVal.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 pl-6">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all`}
                    style={{ width: `${barWidth}%` }}
                  />
                </div>
              </div>
            </div>
          )
        })}

        <div className="pt-2 border-t flex justify-between text-xs text-muted-foreground">
          <span>Canal</span>
          <div className="flex gap-4">
            <span>ROAS</span>
            <span className="w-12 text-right">Contrib.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
