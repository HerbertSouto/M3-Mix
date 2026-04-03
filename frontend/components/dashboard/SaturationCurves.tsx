'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SaturationPoint } from '@/lib/types'

const CHANNEL_COLORS: Record<string, string> = {
  tv:     '#3b82f6',
  search: '#10b981',
  social: '#8b5cf6',
  radio:  '#f59e0b',
  ooh:    '#f43f5e',
}

function getColor(channel: string): string {
  const key = channel.replace('_spend', '')
  return CHANNEL_COLORS[key] ?? '#64748b'
}

function formatBRL(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

/** Estimate current spend as midpoint of the provided data range */
function estimateCurrentSpend(points: SaturationPoint[]): number {
  if (!points.length) return 0
  const maxX = Math.max(...points.map(p => p.x))
  return maxX / 1.5  // data was generated up to max_spend * 1.5
}

interface Props {
  saturation: Record<string, SaturationPoint[]>
  channels: string[]
}

export function SaturationCurves({ saturation, channels }: Props) {
  const nonBaseline = channels.filter(c => c !== 'baseline')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Curvas de Saturação</CardTitle>
        <p className="text-xs text-muted-foreground">retorno marginal por investimento adicional</p>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-5 ${nonBaseline.length > 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {nonBaseline.map((ch) => {
            const data = saturation[ch] ?? []
            const color = getColor(ch)
            const currentSpend = estimateCurrentSpend(data)
            const name = ch.replace('_spend', '')

            // Find saturation point (~90% of max response)
            const maxY = Math.max(...data.map(p => p.y))
            const satPoint = data.find(p => p.y >= maxY * 0.9)

            return (
              <div key={ch} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-xs font-medium capitalize">{name}</span>
                    {satPoint && (() => {
                      const ratio = currentSpend / satPoint.x
                      const saturated = ratio >= 0.85
                      return (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          borderRadius: 99, padding: '2px 8px',
                          letterSpacing: '.04em',
                          color: saturated ? '#fb923c' : '#34d399',
                          border: `1px solid ${saturated ? '#fb923c40' : '#34d39940'}`,
                          background: saturated ? '#fb923c12' : '#34d39912',
                        }}>
                          {saturated ? 'Saturado' : 'Pode escalar'}
                        </span>
                      )
                    })()}
                  </div>
                  {satPoint && (
                    <span className="text-xs text-muted-foreground">
                      satura em {formatBRL(satPoint.x)}
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={data} margin={{ top: 2, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="currentColor"
                      className="text-muted-foreground/10"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="x"
                      tick={{ fontSize: 9, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatBRL}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      domain={[0, 1]}
                      tick={{ fontSize: 9, fill: 'currentColor' }}
                      className="text-muted-foreground"
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      width={32}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '11px',
                      }}
                      formatter={(v: unknown) => [`${(Number(v) * 100).toFixed(1)}%`, 'Saturação']}
                      labelFormatter={(l) => `Spend: ${formatBRL(Number(l))}`}
                    />
                    {currentSpend > 0 && (
                      <ReferenceLine
                        x={currentSpend}
                        stroke={color}
                        strokeDasharray="4 2"
                        strokeOpacity={0.5}
                        label={{
                          value: 'atual',
                          position: 'insideTopRight',
                          fontSize: 9,
                          fill: color,
                        }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="y"
                      stroke={color}
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
