'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAnalysisStatus } from '@/lib/api'

const STEPS = [
  { key: 'downloading', label: 'Baixando CSV', description: 'Buscando arquivo do storage' },
  { key: 'fitting', label: 'Ajustando modelo MMM', description: 'Amostrando distribuições posteriores via MCMC' },
  { key: 'extracting', label: 'Extraindo resultados', description: 'Calculando ROAS, contribuições e curvas de saturação' },
  { key: 'optimizing', label: 'Otimizando budget', description: 'Encontrando alocação ideal de investimento' },
  { key: 'narrative', label: 'Gerando análise IA', description: 'Criando relatório executivo com inteligência artificial' },
  { key: 'saving', label: 'Salvando resultados', description: 'Persistindo dados no banco' },
] as const

type StepKey = (typeof STEPS)[number]['key']

function getStepIndex(step: string | null): number {
  if (!step) return -1
  return STEPS.findIndex(s => s.key === step)
}

interface Props {
  analysisId: string
}

export function StatusPoller({ analysisId }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const elapsedRef = useRef(0)
  const [logs, setLogs] = useState<{ time: number; message: string }[]>([])

  // Polling for status — elapsedRef used instead of elapsed state to avoid
  // recreating the interval every second
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status, step } = await getAnalysisStatus(analysisId)

        if (step && step !== currentStep) {
          setCurrentStep(step)
          const stepDef = STEPS.find(s => s.key === step)
          if (stepDef) {
            setLogs(prev => [...prev, { time: elapsedRef.current, message: stepDef.label }])
          }
        }

        if (status === 'completed') {
          clearInterval(interval)
          setLogs(prev => [...prev, { time: elapsedRef.current, message: 'Análise concluída!' }])
          setTimeout(() => router.refresh(), 500)
        } else if (status === 'failed') {
          clearInterval(interval)
          setLogs(prev => [...prev, { time: elapsedRef.current, message: 'Erro na análise.' }])
          setTimeout(() => router.refresh(), 1000)
        }
      } catch {
        // keep polling
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [analysisId, router, currentStep])

  // Elapsed timer — updates both the ref (for log timestamps) and state (for display)
  useEffect(() => {
    const timer = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const activeIndex = getStepIndex(currentStep)

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      <div className="w-full max-w-lg space-y-2 text-center">
        <h2 className="font-semibold text-xl">Rodando análise MMM</h2>
        <p className="text-sm text-muted-foreground">
          Tempo decorrido: {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
        </p>
      </div>

      {/* Stepper */}
      <div className="w-full max-w-lg space-y-0">
        {STEPS.map((step, i) => {
          const isDone = activeIndex > i
          const isActive = activeIndex === i
          const isPending = activeIndex < i

          return (
            <div key={step.key} className="flex items-start gap-3">
              {/* Indicator column */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all duration-500
                    ${isDone
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : isActive
                        ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                        : 'bg-muted border-border text-muted-foreground'
                    }
                  `}
                >
                  {isDone ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-8 transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : 'bg-border'
                    }`}
                  />
                )}
              </div>

              {/* Text column */}
              <div className={`pt-1 pb-4 ${isPending ? 'opacity-40' : ''}`}>
                <p className={`text-sm font-medium ${isActive ? 'text-foreground' : isDone ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                  {step.label}
                </p>
                {isActive && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Log console */}
      <div className="w-full max-w-lg">
        <div className="bg-muted/50 rounded-lg border p-3 max-h-36 overflow-y-auto font-mono text-xs space-y-1">
          <p className="text-muted-foreground">--- log da análise ---</p>
          {logs.map((log, i) => (
            <p key={i} className="text-muted-foreground">
              <span className="text-foreground/60">
                [{Math.floor(log.time / 60)}:{String(log.time % 60).padStart(2, '0')}]
              </span>{' '}
              {log.message}
            </p>
          ))}
          {logs.length > 0 && (
            <span className="inline-block w-1.5 h-3.5 bg-foreground/60 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}
