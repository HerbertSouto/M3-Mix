'use client'
import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DecompositionPoint } from '@/lib/types'

const CHANNEL_COLORS: Record<string, string> = {
  tv:       '#3b82f6',
  search:   '#10b981',
  social:   '#8b5cf6',
  radio:    '#f59e0b',
  ooh:      '#f43f5e',
  baseline: '#94a3b8',
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

interface Props {
  decomposition: DecompositionPoint[]
}

export function DecompositionChart({ decomposition }: Props) {
  const { chartData, channels } = useMemo(() => {
    const byDate: Record<string, Record<string, number | string>> = {}
    const channelSet = new Set<string>()

    for (const point of decomposition) {
      if (!byDate[point.date]) byDate[point.date] = { date: point.date }
      byDate[point.date][point.channel] = point.value
      channelSet.add(point.channel)
    }

    // Order: baseline first (bottom of stack), then channels sorted alphabetically
    const allChannels = Array.from(channelSet)
    const baseline = allChannels.filter(c => c === 'baseline')
    const rest = allChannels.filter(c => c !== 'baseline').sort()

    return {
      chartData: Object.values(byDate).sort((a, b) =>
        String(a.date).localeCompare(String(b.date))
      ),
      channels: [...baseline, ...rest],
    }
  }, [decomposition])

  // Format date labels to show only month/day
  function formatDate(d: string) {
    const parts = d.split('-')
    if (parts.length === 3) return `${parts[1]}/${parts[2]}`
    return d
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Decomposição de Receita por Canal</CardTitle>
        <p className="text-xs text-muted-foreground">contribuição acumulada ao longo do tempo</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              {channels.map((ch) => (
                <linearGradient key={ch} id={`grad-${ch}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={getColor(ch)} stopOpacity={0.5} />
                  <stop offset="95%" stopColor={getColor(ch)} stopOpacity={0.15} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="text-muted-foreground/10"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatDate}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'currentColor' }}
              className="text-muted-foreground"
              tickLine={false}
              axisLine={false}
              tickFormatter={formatBRL}
              width={56}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#13131f',
                border: '1px solid rgba(238,238,245,.12)',
                borderRadius: '10px',
                fontSize: '12px',
                color: '#eeeef5',
                boxShadow: '0 8px 32px rgba(0,0,0,.5)',
                padding: '10px 14px',
              }}
              labelStyle={{ color: 'rgba(238,238,245,.5)', marginBottom: 6, fontSize: 11 }}
              itemStyle={{ color: '#eeeef5', padding: '2px 0' }}
              formatter={(v: unknown, name: unknown) => [
                formatBRL(Number(v)),
                String(name).replace('_spend', ''),
              ]}
              labelFormatter={(l) => `Data: ${l}`}
            />
            <Legend
              formatter={(v) => (
                <span className="text-xs capitalize">{String(v).replace('_spend', '')}</span>
              )}
            />
            {channels.map((ch) => (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                stackId="1"
                stroke={getColor(ch)}
                fill={`url(#grad-${ch})`}
                strokeWidth={1.5}
                name={ch}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
