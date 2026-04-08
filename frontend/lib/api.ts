import { NextRequest } from 'next/server'

export function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
}

export function internalHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Internal-Token': process.env.INTERNAL_API_SECRET ?? '',
  }
}

export async function uploadCsv(file: File, channels: string[]): Promise<{ analysis_id: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('channels', JSON.stringify(channels))
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function getAnalysisStatus(id: string): Promise<{ status: string; step: string | null }> {
  const res = await fetch(`/api/analysis/${id}/status`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}
