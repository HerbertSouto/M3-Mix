export type AnalysisStatus = 'processing' | 'completed' | 'failed'

export interface Analysis {
  id: string
  created_at: string
  status: AnalysisStatus
  csv_url: string
  channels: string[]
  date_range: string | null
}

export interface SaturationPoint {
  x: number
  y: number
}

export interface DecompositionPoint {
  date: string
  channel: string
  value: number
}

export interface BudgetRecommendation {
  current_allocation: Record<string, number>
  suggested_allocation: Record<string, number>
  current_revenue_estimate: number
  suggested_revenue_estimate: number
  uplift_percent: number
}

export interface AnalysisResults {
  id: string
  analysis_id: string
  roas: Record<string, number>
  contributions: Record<string, number>
  saturation: Record<string, SaturationPoint[]>
  adstock: Record<string, number>
  decomposition: DecompositionPoint[]
  budget_recommendation: BudgetRecommendation
  ai_narrative: string
}
