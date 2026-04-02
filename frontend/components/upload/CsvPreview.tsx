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
              className={h.endsWith('_spend') ? 'cursor-pointer' : 'opacity-50'}
              onClick={() => h.endsWith('_spend') && toggle(h)}
            >
              {h}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {selected.length} canal{selected.length !== 1 ? 'is' : ''} selecionado{selected.length !== 1 ? 's' : ''} para análise
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
