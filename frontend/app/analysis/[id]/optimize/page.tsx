'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BudgetSlider } from '@/components/optimize/BudgetSlider'
import { AllocationComparison } from '@/components/optimize/AllocationComparison'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AnalysisResults, BudgetRecommendation } from '@/lib/types'
import Link from 'next/link'

export default function OptimizePage() {
  const { id } = useParams<{ id: string }>()
  const [results, setResults] = useState<AnalysisResults | null>(null)
  const [budget, setBudget] = useState(0)
  const [optimized, setOptimized] = useState<BudgetRecommendation | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('analysis_results')
      .select('*')
      .eq('analysis_id', id)
      .single()
      .then(({ data }) => {
        if (data) {
          setResults(data as AnalysisResults)
          const currentTotal = Object.values(
            data.budget_recommendation.current_allocation as Record<string, number>
          ).reduce((a, b) => a + b, 0)
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
    runOptimize(v)
  }

  if (!results || !optimized) {
    return <div className="p-8 text-muted-foreground">Carregando...</div>
  }

  const currentTotal = Object.values(optimized.current_allocation).reduce((a, b) => a + b, 0)

  return (
    <main className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/analysis/${id}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Voltar ao dashboard
        </Link>
        <h1 className="text-2xl font-bold">Otimizador de Budget</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajuste o Budget Total</CardTitle>
        </CardHeader>
        <CardContent>
          <BudgetSlider
            value={budget}
            min={Math.round(currentTotal * 0.5)}
            max={Math.round(currentTotal * 2)}
            onChange={handleBudgetChange}
          />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Estimada Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${optimized.current_revenue_estimate.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita Estimada Otimizada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold">
                ${optimized.suggested_revenue_estimate.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
              <Badge variant={optimized.uplift_percent > 0 ? 'default' : 'destructive'}>
                {optimized.uplift_percent > 0 ? '+' : ''}{optimized.uplift_percent.toFixed(1)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <AllocationComparison
        current={optimized.current_allocation}
        suggested={optimized.suggested_allocation}
      />

      {loading && (
        <p className="text-sm text-muted-foreground text-center">Recalculando...</p>
      )}
    </main>
  )
}
