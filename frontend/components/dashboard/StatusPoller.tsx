'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAnalysisStatus } from '@/lib/api'

const STEPS = [
  { label: 'Carregando dados', duration: 8 },
  { label: 'Ajustando adstock e saturação', duration: 20 },
  { label: 'Amostrando distribuições posteriores (MCMC)', duration: 60 },
  { label: 'Calculando ROAS e contribuições', duration: 15 },
  { label: 'Gerando insights com IA', duration: 10 },
]

interface Props {
  analysisId: string
}

export function StatusPoller({ analysisId }: Props) {
  const router = useRouter()
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const tick = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status } = await getAnalysisStatus(analysisId)
        if (status === 'completed' || status === 'failed') {
          clearInterval(interval)
          router.refresh()
        }
      } catch {
        // keep polling
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [analysisId, router])

  // Determine current step based on elapsed time
  let acc = 0
  let currentStep = 0
  for (let i = 0; i < STEPS.length; i++) {
    acc += STEPS[i].duration
    if (elapsed < acc) { currentStep = i; break }
    currentStep = STEPS.length - 1
  }

  // Progress within the total estimated time
  const totalDuration = STEPS.reduce((s, st) => s + st.duration, 0)
  const progress = Math.min((elapsed / totalDuration) * 100, 95)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      {/* Animated orb */}
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-foreground/5 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-2 rounded-full bg-foreground/10 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
        <div className="absolute inset-4 rounded-full bg-foreground/15 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.6s' }} />
        <div className="absolute inset-6 rounded-full bg-foreground flex items-center justify-center">
          <svg className="w-5 h-5 text-background animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
      </div>

      <div className="w-full max-w-sm space-y-6 text-center">
        <div>
          <h2 className="font-semibold text-lg">Rodando análise MMM</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {STEPS[currentStep].label}
            <span className="inline-flex gap-0.5 ml-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          </p>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-foreground rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
        </div>

        {/* Steps list */}
        <div className="space-y-2 text-left">
          {STEPS.map((step, i) => {
            const isDone = i < currentStep
            const isActive = i === currentStep
            return (
              <div key={i} className={`flex items-center gap-2 text-xs transition-opacity ${isActive ? 'opacity-100' : isDone ? 'opacity-40' : 'opacity-20'}`}>
                <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${isDone ? 'bg-foreground' : isActive ? 'border-2 border-foreground' : 'border border-muted-foreground'}`}>
                  {isDone && (
                    <svg className="w-2 h-2 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={isActive ? 'font-medium' : ''}>{step.label}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
