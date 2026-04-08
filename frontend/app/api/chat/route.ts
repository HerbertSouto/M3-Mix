import { NextRequest } from 'next/server'
import { getClientIp, internalHeaders } from '@/lib/api'

// Secondary IP-based rate limit (primary is session_id on the backend)
// In-memory: resets on cold start, but good enough as a secondary defense
const _ipCounts = new Map<string, { count: number; resetAt: number }>()
const CHAT_IP_LIMIT = 120 // messages per IP per hour

function checkChatIpLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = _ipCounts.get(ip)
  if (!entry || entry.resetAt < now) {
    _ipCounts.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 })
    return true
  }
  if (entry.count >= CHAT_IP_LIMIT) return false
  entry.count++
  return true
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  if (!checkChatIpLimit(ip)) {
    return new Response(null, { status: 429 })
  }
  const body = await req.json()

  let response: Response
  try {
    response = await fetch(`${process.env.FASTAPI_URL}/chat`, {
      method: 'POST',
      headers: internalHeaders(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000), // 60s max — Groq can be slow on first token
    })
  } catch {
    return new Response('data: [ERROR] Backend unavailable\n\ndata: [DONE]\n\n', {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  if (response.status === 429) {
    return new Response(null, { status: 429 })
  }

  if (!response.ok || !response.body) {
    return new Response(`data: [ERROR] Backend error ${response.status}\n\ndata: [DONE]\n\n`, {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
  }

  const reader = response.body.getReader()

  // Re-wrap the stream so Next.js never sees the raw undici socket error
  // (UND_ERR_SOCKET when FastAPI closes normally). We catch it and close cleanly.
  const stream = new ReadableStream({
    async pull(controller) {
      try {
        const { done, value } = await reader.read()
        if (done) {
          controller.close()
        } else {
          controller.enqueue(value)
        }
      } catch {
        controller.close()
      }
    },
    cancel() {
      reader.cancel().catch(() => {})
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
