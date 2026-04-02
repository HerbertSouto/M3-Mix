'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Progress } from '@/components/ui/progress'
import { getAnalysisStatus } from '@/lib/api'

interface Props {
  analysisId: string
}

export function StatusPoller({ analysisId }: Props) {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status } = await getAnalysisStatus(analysisId)
        if (status === 'completed') {
          clearInterval(interval)
          router.refresh()
        } else if (status === 'failed') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // keep polling
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [analysisId, router])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="w-full max-w-md space-y-4">
        <h2 className="text-center font-semibold text-lg">Rodando análise MMM</h2>
        <Progress value={null} className="h-2 animate-pulse" />
        <p className="text-center text-sm text-muted-foreground">
          O modelo está amostrando distribuições posteriores via MCMC
        </p>
        <p className="text-center text-xs text-muted-foreground">
          Isso pode levar 1-2 minutos...
        </p>
      </div>
    </div>
  )
}
