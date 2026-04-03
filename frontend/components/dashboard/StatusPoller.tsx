'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getAnalysisStatus } from '@/lib/api'

const ACCENT = '#e4ff1a'
const BG     = '#07070f'
const SYNE   = 'var(--font-syne), sans-serif'

const STEPS = [
  { key: 'downloading', label: 'Baixando CSV',         detail: 'Buscando arquivo do storage' },
  { key: 'fitting',     label: 'Ajustando modelo MMM', detail: 'Amostrando distribuições posteriores via MCMC' },
  { key: 'extracting',  label: 'Extraindo resultados', detail: 'Calculando ROAS, contribuições e curvas de saturação' },
  { key: 'optimizing',  label: 'Otimizando budget',    detail: 'Encontrando alocação ideal de investimento' },
  { key: 'narrative',   label: 'Gerando análise IA',   detail: 'Escrevendo relatório executivo com inteligência artificial' },
  { key: 'saving',      label: 'Salvando resultados',  detail: 'Persistindo dados no banco' },
] as const

function getStepIndex(step: string | null) {
  if (!step) return -1
  return STEPS.findIndex(s => s.key === step)
}

function fmtTime(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface Props { analysisId: string }

export function StatusPoller({ analysisId }: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [elapsed, setElapsed]         = useState(0)
  const elapsedRef                    = useRef(0)
  const [logs, setLogs]               = useState<{ time: number; message: string }[]>([])
  const logEndRef                     = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { status, step } = await getAnalysisStatus(analysisId)
        if (step && step !== currentStep) {
          setCurrentStep(step)
          const def = STEPS.find(s => s.key === step)
          if (def) setLogs(prev => [...prev, { time: elapsedRef.current, message: def.label }])
        }
        if (status === 'completed') {
          clearInterval(interval)
          setLogs(prev => [...prev, { time: elapsedRef.current, message: '✓ Análise concluída' }])
          setTimeout(() => router.refresh(), 600)
        } else if (status === 'failed') {
          clearInterval(interval)
          setLogs(prev => [...prev, { time: elapsedRef.current, message: '✗ Erro na análise' }])
          setTimeout(() => router.refresh(), 1200)
        }
      } catch { /* keep polling */ }
    }, 2000)
    return () => clearInterval(interval)
  }, [analysisId, router, currentStep])

  useEffect(() => {
    const t = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(e => e + 1)
    }, 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const activeIndex = getStepIndex(currentStep)

  return (
    <div className="dark" style={{
      minHeight: '100vh', background: BG, color: '#eeeef5',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 24px',
    }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes spin  { to{transform:rotate(360deg)} }
        @keyframes blink { 0%,100%{opacity:1}50%{opacity:0} }
      `}</style>

      {/* Background dot grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle,rgba(238,238,245,.045) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }}/>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 60% 35% at 50% 0%,${ACCENT}10 0%,transparent 70%)`,
      }}/>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          {/* Spinner ring */}
          <div style={{
            width: 48, height: 48,
            border: `2px solid rgba(238,238,245,.07)`,
            borderTopColor: ACCENT,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px',
          }}/>
          <h2 style={{
            fontFamily: SYNE, fontWeight: 800,
            fontSize: 22, letterSpacing: '-.02em', marginBottom: 6,
          }}>
            Rodando análise MMM
          </h2>
          <p style={{
            fontSize: 12, color: 'rgba(238,238,245,.3)',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}>
            {fmtTime(elapsed)} decorrido
          </p>
        </div>

        {/* Steps */}
        <div style={{ marginBottom: 32 }}>
          {STEPS.map((step, i) => {
            const isDone    = activeIndex > i
            const isActive  = activeIndex === i
            const isPending = activeIndex < i

            return (
              <div key={step.key} style={{ display: 'flex', gap: 14 }}>
                {/* Indicator column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, fontFamily: SYNE,
                    flexShrink: 0,
                    border: `1.5px solid ${
                      isDone   ? '#34d399' :
                      isActive ? ACCENT :
                      'rgba(238,238,245,.1)'
                    }`,
                    background: isDone
                      ? 'rgba(52,211,153,.12)'
                      : isActive
                        ? `${ACCENT}15`
                        : 'transparent',
                    color: isDone
                      ? '#34d399'
                      : isActive
                        ? ACCENT
                        : 'rgba(238,238,245,.2)',
                    transition: 'all .4s',
                    ...(isActive ? { animation: 'pulse 2s ease infinite' } : {}),
                  }}>
                    {isDone ? (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: 1, height: 28, flexShrink: 0,
                      background: isDone ? '#34d39940' : 'rgba(238,238,245,.06)',
                      transition: 'background .4s',
                    }}/>
                  )}
                </div>

                {/* Text */}
                <div style={{
                  paddingTop: 4, paddingBottom: 16,
                  opacity: isPending ? 0.3 : 1,
                  transition: 'opacity .3s',
                }}>
                  <p style={{
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#eeeef5' : 'rgba(238,238,245,.55)',
                    letterSpacing: '-.01em',
                  }}>
                    {step.label}
                  </p>
                  {isActive && (
                    <p style={{
                      fontSize: 11, color: 'rgba(238,238,245,.3)',
                      marginTop: 2, lineHeight: 1.5,
                    }}>
                      {step.detail}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Terminal log */}
        <div style={{
          border: '1px solid rgba(238,238,245,.07)',
          borderRadius: 10,
          overflow: 'hidden',
          background: 'rgba(238,238,245,.02)',
        }}>
          {/* Terminal header */}
          <div style={{
            borderBottom: '1px solid rgba(238,238,245,.06)',
            padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {['#ff5f57','#ffbd2e','#28c840'].map(c => (
              <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, opacity: .5 }}/>
            ))}
            <span style={{
              fontSize: 10, color: 'rgba(238,238,245,.25)',
              letterSpacing: '.06em', fontWeight: 500, marginLeft: 4,
            }}>
              LOG DA ANÁLISE
            </span>
          </div>
          <div style={{
            padding: '12px 14px',
            maxHeight: 120, overflowY: 'auto',
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 11, lineHeight: 1.7,
          }}>
            <p style={{ color: 'rgba(238,238,245,.2)' }}>$ m3mix analyze --model bayesian --chains 2</p>
            {logs.map((log, i) => (
              <p key={i} style={{ color: 'rgba(238,238,245,.5)' }}>
                <span style={{ color: ACCENT, opacity: .7 }}>[{fmtTime(log.time)}]</span>
                {' '}{log.message}
              </p>
            ))}
            {logs.length > 0 && (
              <span style={{
                display: 'inline-block', width: 6, height: 12,
                background: ACCENT, opacity: .7,
                animation: 'blink 1s step-end infinite', marginLeft: 2,
              }}/>
            )}
            <div ref={logEndRef}/>
          </div>
        </div>

        {/* Bottom note */}
        <p style={{
          textAlign: 'center', marginTop: 20,
          fontSize: 11, color: 'rgba(238,238,245,.18)',
          lineHeight: 1.6,
        }}>
          O modelo MCMC pode levar alguns minutos.<br/>
          Não feche esta janela.
        </p>
      </div>
    </div>
  )
}
