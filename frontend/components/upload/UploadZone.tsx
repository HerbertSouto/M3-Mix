'use client'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  onFile: (file: File, headers: string[]) => void
}

export function UploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const firstLine = (e.target?.result as string).split('\n')[0]
      const headers = firstLine.split(',').map(h => h.trim())
      onFile(file, headers)
    }
    reader.readAsText(file)
  }, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) handleFile(file)
  }, [handleFile])

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-colors ${
        dragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/50'
      }`}
    >
      <p className="text-muted-foreground mb-4">Arraste um arquivo CSV aqui</p>
      <p className="text-xs text-muted-foreground mb-6">
        Colunas obrigatórias: <code className="bg-muted px-1 rounded">date</code>,{' '}
        <code className="bg-muted px-1 rounded">revenue</code>, e pelo menos um canal{' '}
        <code className="bg-muted px-1 rounded">*_spend</code>
      </p>
      <label className="cursor-pointer">
        <Button variant="outline" type="button" onClick={(e) => {
          e.preventDefault()
          ;(e.currentTarget.nextElementSibling as HTMLInputElement)?.click()
        }}>
          Selecionar arquivo
        </Button>
        <input
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </label>
    </div>
  )
}
