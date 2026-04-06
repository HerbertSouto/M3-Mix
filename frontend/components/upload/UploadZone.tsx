'use client'
import { useCallback, useState } from 'react'
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx'
import { Button } from '@/components/ui/button'

interface Props {
  onFile: (file: File, headers: string[]) => void
}

const ACCEPTED = '.csv,.xlsx'

async function extractHeaders(file: File): Promise<string[]> {
  if (file.name.endsWith('.xlsx')) {
    const buf = await file.arrayBuffer()
    const wb = xlsxRead(buf, { type: 'array' })
    // Prefer sheet named 'dataset', otherwise first sheet
    const sheetName = wb.SheetNames.includes('dataset')
      ? 'dataset'
      : wb.SheetNames[0]
    const ws = wb.Sheets[sheetName]
    const rows = xlsxUtils.sheet_to_json<string[]>(ws, { header: 1 })
    return (rows[0] as string[]).map(h => String(h).trim())
  }
  // CSV
  const text = await file.text()
  return text.split('\n')[0].split(',').map(h => h.trim())
}

export function UploadZone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)

  const handleFile = useCallback(async (file: File) => {
    const headers = await extractHeaders(file)
    onFile(file, headers)
  }, [onFile])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.name.endsWith('.xlsx'))) {
      handleFile(file)
    }
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
      <p className="text-muted-foreground mb-4">Arraste um arquivo CSV ou XLSX aqui</p>
      <p className="text-xs text-muted-foreground mb-6" style={{maxWidth:380,margin:'0 auto 20px',lineHeight:1.7}}>
        O arquivo precisa ter uma coluna <code className="bg-muted px-1 rounded">date</code> (semana),{' '}
        <code className="bg-muted px-1 rounded">revenue</code> (receita da semana em R$) e pelo menos
        um canal de mídia com sufixo <code className="bg-muted px-1 rounded">_spend</code>{' '}
        — como <code className="bg-muted px-1 rounded">tv_spend</code> ou <code className="bg-muted px-1 rounded">search_spend</code>.
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
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
        />
      </label>
    </div>
  )
}
