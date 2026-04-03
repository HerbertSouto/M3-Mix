import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const channels = JSON.parse(formData.get('channels') as string) as string[]

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const supabase = createServerClient()

  const isXlsx = file.name.endsWith('.xlsx')
  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const contentType = isXlsx
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv'
  const { error: uploadError } = await supabase.storage
    .from('csv-uploads')
    .upload(filename, bytes, { contentType })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('csv-uploads')
    .getPublicUrl(filename)

  const { data: analysis, error: dbError } = await supabase
    .from('analyses')
    .insert({ status: 'processing', csv_url: publicUrl, channels })
    .select()
    .single()

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const backendRes = await fetch(`${process.env.FASTAPI_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
