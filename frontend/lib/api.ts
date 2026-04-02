export async function uploadCsv(file: File, channels: string[]): Promise<{ analysis_id: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('channels', JSON.stringify(channels))
  const res = await fetch('/api/upload', { method: 'POST', body: formData })
  if (!res.ok) throw new Error('Upload failed')
  return res.json()
}

export async function getAnalysisStatus(id: string): Promise<{ status: string }> {
  const res = await fetch(`/api/analysis/${id}/status`)
  if (!res.ok) throw new Error('Failed to fetch status')
  return res.json()
}
