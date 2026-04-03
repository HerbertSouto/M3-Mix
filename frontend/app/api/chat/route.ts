import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const body = await req.json()

  let response: Response
  try {
    response = await fetch(`${process.env.FASTAPI_URL}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch {
    return new Response('data: [ERROR] Backend unavailable\n\ndata: [DONE]\n\n', {
      status: 200,
      headers: { 'Content-Type': 'text/event-stream' },
    })
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
