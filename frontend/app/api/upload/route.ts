import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File
  const channels = JSON.parse(formData.get('channels') as string) as string[]

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const supabase = createServerClient()

  const filename = `${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const { error: uploadError } = await supabase.storage
    .from('csv-uploads')
    .upload(filename, bytes, { contentType: 'text/csv' })

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

  await fetch(`${process.env.FASTAPI_URL}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      analysis_id: analysis.id,
      csv_url: publicUrl,
      channels,
    }),
  })

  return NextResponse.json({ analysis_id: analysis.id })
}
