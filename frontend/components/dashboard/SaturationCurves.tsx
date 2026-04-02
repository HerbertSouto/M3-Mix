'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
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
            <p className="text-sm font-medium mb-2 capitalize">{ch.replace('_spend', '')}</p>
            <ResponsiveContainer width="100%" height={120}>
              <LineChart data={saturation[ch] ?? []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="x"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  domain={[0, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                />
                <Tooltip
                  formatter={(v: unknown) => `${(Number(v) * 100).toFixed(1)}%`}
                  labelFormatter={(l) => `Spend: $${Number(l).toLocaleString('en-US')}`}
                />
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke="#2563eb"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
