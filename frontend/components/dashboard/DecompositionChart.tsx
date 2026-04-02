'use client'
import { useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DecompositionPoint } from '@/lib/types'

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed', '#0891b2']

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
            <YAxis
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: unknown) =>
                `$${Number(v).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
              }
            />
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
