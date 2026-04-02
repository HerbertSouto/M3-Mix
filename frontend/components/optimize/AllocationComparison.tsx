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
            <YAxis
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(v: unknown) =>
                `$${Number(v).toLocaleString('en-US')}`
              }
            />
            <Legend />
            <Bar dataKey="Atual" fill="#94a3b8" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Sugerido" fill="#2563eb" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
