'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { BudgetSlider } from '@/components/optimize/BudgetSlider'
import { AnalysisResults, BudgetRecommendation } from '@/lib/types'
import Link from 'next/link'

const ACCENT = '#e4ff1a'
const SYNE   = 'var(--font-syne), sans-serif'

const CHANNEL_COLORS: Record<string, string> = {
  tv:     '#3b82f6',
  search: '#10b981',
  social: '#8b5cf6',
  radio:  '#f59e0b',
  ooh:    '#f43f5e',
}

function getColor(ch: string) {
  const key = ch.replace('_spend', '').toLowerCase()
  for (const [k, v] of Object.entries(CHANNEL_COLORS)) {
    if (key.includes(k)) return v
  }
  return '#64748b'
}

function formatBRL(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(0)}k`
  return `R$${v.toFixed(0)}`
}

export default function OptimizePage() {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [budget, setBudget] = useState(0)
  const [optimized, setOptimized] = useState<BudgetRecommendation | null>(null)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    fetch(`/api/analysis/${id}/results`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setResults(data as AnalysisResults)
          const currentTotal = Object.values(
            data.budget_recommendation.current_allocation as Record<string, number>
          ).reduce((a: number, b: unknown) => a + (b as number), 0)
          setBudget(currentTotal)
          setOptimized(data.budget_recommendation as BudgetRecommendation)
        }
      })
  }, [id])

  const runOptimize = useCallback(async (newBudget: number) => {
    if (!results) return
    setLoading(true)
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_id: id,
          total_budget: newBudget,
          current_allocation: results.budget_recommendation.current_allocation,
          roas: results.roas,
        }),
      })
      const data = await res.json()
      setOptimized(data)
    } finally {
      setLoading(false)
    }
  }, [results, id])

  const handleBudgetChange = (v: number) => {
    setBudget(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => runOptimize(v), 400)
  }

  if (!results || !optimized) {
    return (
      <div className="dark" style={{
        minHeight: '100vh', background: '#09090f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `2px solid rgba(228,255,26,.15)`,
          borderTopColor: ACCENT,
          animation: 'spin .8s linear infinite',
        }}/>
      </div>
    )
  }

  const currentTotal = Object.values(optimized.current_allocation).reduce((a, b) => a + b, 0)
  const channels = Object.keys(optimized.current_allocation)
  const upliftPositive = optimized.uplift_percent > 0

  return (
    <div className="dark" style={{ minHeight: '100vh', background: '#09090f', color: '#eeeef5' }}>
      {/* Dot grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle,rgba(238,238,245,.04) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }}/>

      {/* Header */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(9,9,15,.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(238,238,245,.06)',
        padding: '14px 40px',
        display: 'flex', alignItems: 'center', gap: 20,
      }}>
        <Link href={`/analysis/${id}`} style={{
          fontSize: 12, color: 'rgba(238,238,245,.3)',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
        }}>
          ← relatório
        </Link>
        <div style={{ width: 1, height: 20, background: 'rgba(238,238,245,.08)' }}/>
        <p style={{
          fontSize: 10, color: 'rgba(238,238,245,.3)',
          letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase',
        }}>
          Otimizador de Budget
        </p>
      </header>

      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 900, margin: '0 auto',
        padding: '48px 40px 96px',
        display: 'flex', flexDirection: 'column', gap: 40,
      }}>

        {/* Title */}
        <div>
          <h1 style={{
            fontFamily: SYNE, fontWeight: 800, fontSize: 28,
            letterSpacing: '-.03em', color: '#eeeef5', marginBottom: 6,
          }}>
            Simule a redistribuição
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(238,238,245,.35)', lineHeight: 1.5 }}>
            Ajuste o budget total e veja como o modelo sugere alocar entre os canais para maximizar a receita.
          </p>
        </div>

        {/* Budget slider */}
        <div style={{
          background: 'rgba(238,238,245,.025)',
          border: '1px solid rgba(238,238,245,.08)',
          borderRadius: 16, padding: '28px 32px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <p style={{ fontSize: 10, color: 'rgba(238,238,245,.3)', letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>
                Budget total
              </p>
              <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 32, letterSpacing: '-.03em', color: '#eeeef5', lineHeight: 1 }}>
                {formatBRL(budget)}
              </p>
            </div>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(238,238,245,.3)', fontSize: 12 }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  border: '1.5px solid rgba(238,238,245,.15)',
                  borderTopColor: 'rgba(238,238,245,.5)',
                  animation: 'spin .7s linear infinite',
                }}/>
                Recalculando...
              </div>
            )}
          </div>
          <BudgetSlider
            key={`${Math.round(currentTotal * 0.5)}-${Math.round(currentTotal * 2)}`}
            value={budget}
            min={Math.round(currentTotal * 0.5)}
            max={Math.round(currentTotal * 2)}
            onChange={handleBudgetChange}
          />
        </div>

        {/* Revenue cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Current */}
          <div style={{
            background: 'rgba(238,238,245,.025)',
            border: '1px solid rgba(238,238,245,.08)',
            borderRadius: 14, padding: '20px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'rgba(148,163,184,.4)' }}/>
            <p style={{ fontSize: 10, color: 'rgba(238,238,245,.3)', letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>
              Receita atual estimada
            </p>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 26, letterSpacing: '-.03em', color: '#eeeef5' }}>
              {formatBRL(optimized.current_revenue_estimate)}
            </p>
          </div>

          {/* Optimized */}
          <div style={{
            background: upliftPositive ? `${ACCENT}07` : 'rgba(251,146,60,.05)',
            border: `1px solid ${upliftPositive ? `${ACCENT}25` : 'rgba(251,146,60,.2)'}`,
            borderRadius: 14, padding: '20px 24px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: upliftPositive ? ACCENT : '#fb923c', opacity: 0.7 }}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <p style={{ fontSize: 10, color: 'rgba(238,238,245,.3)', letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase' }}>
                Receita otimizada
              </p>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: upliftPositive ? ACCENT : '#fb923c',
                border: `1px solid ${upliftPositive ? `${ACCENT}40` : 'rgba(251,146,60,.4)'}`,
                background: upliftPositive ? `${ACCENT}12` : 'rgba(251,146,60,.1)',
                borderRadius: 99, padding: '2px 9px',
              }}>
                {upliftPositive ? '+' : ''}{optimized.uplift_percent.toFixed(1)}%
              </span>
            </div>
            <p style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 26, letterSpacing: '-.03em', color: upliftPositive ? ACCENT : '#fb923c' }}>
              {formatBRL(optimized.suggested_revenue_estimate)}
            </p>
          </div>
        </div>

        {/* Channel allocation */}
        <div style={{
          background: 'rgba(238,238,245,.025)',
          border: '1px solid rgba(238,238,245,.08)',
          borderRadius: 16, overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(238,238,245,.06)' }}>
            <p style={{ fontFamily: SYNE, fontWeight: 700, fontSize: 14, color: '#eeeef5', letterSpacing: '-.01em' }}>
              Alocação por canal
            </p>
          </div>
          <div style={{ padding: '8px 0' }}>
            {channels.map(ch => {
              const name    = ch.replace('_spend', '')
              const color   = getColor(ch)
              const current = optimized.current_allocation[ch] ?? 0
              const suggest = optimized.suggested_allocation[ch] ?? 0
              const delta   = suggest - current
              const deltaP  = current > 0 ? (delta / current) * 100 : 0
              const maxVal  = Math.max(current, suggest, 1)
              const increase = delta > 0

              return (
                <div key={ch} style={{ padding: '16px 28px', borderBottom: '1px solid rgba(238,238,245,.04)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80` }}/>
                      <span style={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize', letterSpacing: '-.01em' }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: 'rgba(238,238,245,.35)', fontFamily: 'var(--font-geist-mono), monospace' }}>
                        {formatBRL(current)} → {formatBRL(suggest)}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: increase ? '#34d399' : '#fb923c',
                        border: `1px solid ${increase ? '#34d39940' : '#fb923c40'}`,
                        background: increase ? '#34d39912' : '#fb923c12',
                        borderRadius: 99, padding: '2px 8px',
                        fontFamily: 'var(--font-geist-mono), monospace',
                      }}>
                        {increase ? '+' : ''}{deltaP.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Bar comparison */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, color: 'rgba(238,238,245,.2)', width: 40, textAlign: 'right', letterSpacing: '.04em' }}>ATUAL</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(238,238,245,.06)' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: 'rgba(238,238,245,.2)',
                          width: `${(current / maxVal) * 100}%`,
                        }}/>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 9, color: 'rgba(238,238,245,.2)', width: 40, textAlign: 'right', letterSpacing: '.04em' }}>SUGER.</span>
                      <div style={{ flex: 1, height: 4, borderRadius: 99, background: 'rgba(238,238,245,.06)' }}>
                        <div style={{
                          height: '100%', borderRadius: 99,
                          background: color,
                          width: `${(suggest / maxVal) * 100}%`,
                          boxShadow: `0 0 8px ${color}50`,
                          transition: 'width .4s ease',
                        }}/>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </main>
    </div>
  )
}
