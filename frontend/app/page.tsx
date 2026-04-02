'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/UploadZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { uploadCsv } from '@/lib/api'

export default function HomePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFile = (f: File, h: string[]) => {
    setFile(f)
    setHeaders(h)
    setError(null)
  }

  const handleAnalyze = async (channels: string[]) => {
    if (!file) return
    setLoading(true)
    try {
      const { analysis_id } = await uploadCsv(file, channels)
      router.push(`/analysis/${analysis_id}`)
    } catch {
      setError('Erro ao enviar arquivo. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 max-w-2xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">M3-Mix</h1>
        <p className="text-muted-foreground text-lg">
          Marketing Mix Modeling com IA — suba seus dados e descubra o que realmente gera receita
        </p>
      </div>
      {!file ? (
        <div className="w-full">
          <UploadZone onFile={handleFile} />
        </div>
      ) : (
        <div className="w-full space-y-4">
          <p className="text-sm text-muted-foreground">
            Arquivo: <strong>{file.name}</strong>
          </p>
          <CsvPreview headers={headers} onAnalyze={handleAnalyze} loading={loading} />
          <button
            onClick={() => { setFile(null); setHeaders([]) }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Trocar arquivo
          </button>
        </div>
      )}
      {error && <p className="text-destructive text-sm mt-4">{error}</p>}
    </main>
  )
}
