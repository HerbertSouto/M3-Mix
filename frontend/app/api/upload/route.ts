import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { read as xlsxRead, utils as xlsxUtils } from 'xlsx'

const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB
const UPLOAD_LIMIT   = 5                  // max uploads per IP per hour

async function checkUploadRateLimit(ip: string): Promise<boolean> {
  const supabase   = createServerClient()
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('upload_rate_limits')
    .select('count, window_start')
    .eq('ip', ip)
    .maybeSingle()

  if (!data) {
    await supabase.from('upload_rate_limits')
      .insert({ ip, count: 1, window_start: new Date().toISOString() })
    return true
  }

  if (data.window_start < oneHourAgo) {
    await supabase.from('upload_rate_limits')
      .update({ count: 1, window_start: new Date().toISOString() })
      .eq('ip', ip)
    return true
  }

  if (data.count >= UPLOAD_LIMIT) return false

  await supabase.from('upload_rate_limits')
    .update({ count: data.count + 1 })
    .eq('ip', ip)
  return true
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          ?? req.headers.get('x-real-ip')
          ?? 'unknown'

  const allowed = await checkUploadRateLimit(ip)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Limite de análises por hora atingido. Tente novamente mais tarde.' },
      { status: 429 }
    )
  }

  let formData: FormData
  try {
    formData = await req.formData()
  } catch (e) {
    console.error('[upload] formData parse error:', e)
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File
  const channelsRaw = formData.get('channels') as string | null
  const channels = channelsRaw ? (JSON.parse(channelsRaw) as string[]) : []

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'Arquivo muito grande. Máximo permitido: 10 MB.' }, { status: 413 })
  }
  console.log('[upload] file:', file.name, file.size, 'channels:', channels)

  const supabase = createServerClient()

  const isXlsx = file.name.endsWith('.xlsx')
  let uploadBytes: ArrayBuffer | Buffer = await file.arrayBuffer()
  let filename = `${Date.now()}-${file.name}`

  if (isXlsx) {
    const wb = xlsxRead(uploadBytes, { type: 'array' })
    const sheetName = wb.SheetNames.includes('dataset') ? 'dataset' : wb.SheetNames[0]
    const csv = xlsxUtils.sheet_to_csv(wb.Sheets[sheetName])
    uploadBytes = Buffer.from(csv)
    filename = filename.replace('.xlsx', '.csv')
    console.log('[upload] converted xlsx sheet', sheetName, '→ csv')
  }

  const contentType = 'text/csv'
  const bytes = uploadBytes
  console.log('[upload] uploading to storage...')
  const { error: uploadError } = await supabase.storage
    .from('csv-uploads')
    .upload(filename, bytes, { contentType })

  if (uploadError) {
    console.error('[upload] storage error:', uploadError)
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('csv-uploads')
    .getPublicUrl(filename)

  console.log('[upload] inserting analysis row...')
  const { data: analysis, error: dbError } = await supabase
    .from('analyses')
    .insert({ status: 'processing', csv_url: publicUrl, channels })
    .select()
    .single()

  if (dbError) {
    console.error('[upload] db error:', dbError)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }
  console.log('[upload] analysis created:', analysis.id)

  const backendRes = await fetch(`${process.env.FASTAPI_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Token': process.env.INTERNAL_API_SECRET ?? '',
    },
    body: JSON.stringify({
      analysis_id: analysis.id,
      csv_url: publicUrl,
      channels,
    }),
  }).catch((err: Error) => {
    console.error('[upload] FastAPI unreachable:', err.message)
    return null
  })

  if (!backendRes || !backendRes.ok) {
    const detail = backendRes ? await backendRes.text() : 'FastAPI offline'
    console.error('[upload] FastAPI error:', detail)
    // Mark analysis as failed so frontend doesn't poll forever
    await supabase.from('analyses').update({ status: 'failed', step: 'error' }).eq('id', analysis.id)
    return NextResponse.json({ error: `Backend error: ${detail}` }, { status: 502 })
  }

  return NextResponse.json({ analysis_id: analysis.id })
}
