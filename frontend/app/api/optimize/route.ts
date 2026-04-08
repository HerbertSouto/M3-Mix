import { NextRequest, NextResponse } from 'next/server'
import { internalHeaders } from '@/lib/api'

export async function POST(req: NextRequest) {
  const body = await req.json()

  const response = await fetch(`${process.env.FASTAPI_URL}/optimize`, {
    method: 'POST',
    headers: internalHeaders(),
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
