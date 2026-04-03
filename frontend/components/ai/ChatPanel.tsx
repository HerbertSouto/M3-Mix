'use client'
import { useState, useRef, useEffect } from 'react'

const ACCENT = '#e4ff1a'
const SYNE   = 'var(--font-syne), sans-serif'

const SUGGESTIONS = [
  'Qual canal devo aumentar o investimento?',
  'Meu ROAS está bom comparado ao mercado?',
  'Quando o canal TV satura?',
  'Como interpretar o adstock?',
]

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  analysisId: string
  analysisContext: Record<string, unknown>
}

export function ChatPanel({ analysisId, analysisContext }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: msg }])
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis_id: analysisId,
        message: msg,
        analysis_context: analysisContext,
      }),
    })

    const reader  = res.body?.getReader()
    const decoder = new TextDecoder()
    let content   = ''
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    while (reader) {
      const { done, value } = await reader.read()
      if (done) break
      const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        const t = line.replace('data: ', '')
        if (t === '[DONE]') break
        if (t.startsWith('[ERROR]')) {
          content = 'Não consegui gerar uma resposta agora. O serviço pode estar sobrecarregado — tente novamente em alguns segundos.'
          setMessages(prev => {
            const u = [...prev]
            u[u.length - 1] = { role: 'assistant', content }
            return u
          })
          break
        }
        content += t
        setMessages(prev => {
          const u = [...prev]
          u[u.length - 1] = { role: 'assistant', content }
          return u
        })
      }
    }
    setLoading(false)
  }

  const hasMessages = messages.length > 0

  return (
    <div style={{
      border: '1px solid rgba(238,238,245,.08)',
      borderRadius: 14,
      background: 'rgba(238,238,245,.025)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        borderBottom: '1px solid rgba(238,238,245,.06)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        {['#ff5f57','#ffbd2e','#28c840'].map(c => (
          <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: .5 }}/>
        ))}
        <span style={{
          fontSize: 10, color: 'rgba(238,238,245,.3)',
          letterSpacing: '.07em', fontWeight: 600, marginLeft: 4,
        }}>
          COPILOT MMM
        </span>
      </div>

      {/* Messages */}
      <div style={{
        minHeight: 180, maxHeight: 380,
        overflowY: 'auto', padding: '20px 20px 12px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {!hasMessages && (
          <div>
            <p style={{ fontSize: 13, color: 'rgba(238,238,245,.3)', marginBottom: 16 }}>
              Pergunte qualquer coisa sobre sua análise. O Copilot conhece todos os seus dados.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    fontSize: 11, color: 'rgba(238,238,245,.45)',
                    border: '1px solid rgba(238,238,245,.1)',
                    background: 'rgba(238,238,245,.03)',
                    borderRadius: 99, padding: '5px 12px',
                    cursor: 'pointer', transition: 'all .15s',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '80%',
              borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
              padding: '10px 14px',
              fontSize: 13, lineHeight: 1.6,
              background: m.role === 'user'
                ? `${ACCENT}18`
                : 'rgba(238,238,245,.06)',
              border: m.role === 'user'
                ? `1px solid ${ACCENT}30`
                : '1px solid rgba(238,238,245,.08)',
              color: m.role === 'user' ? ACCENT : 'rgba(238,238,245,.8)',
            }}>
              {m.content || (
                <span style={{ display: 'inline-flex', gap: 3 }}>
                  {[0,1,2].map(d => (
                    <span key={d} style={{
                      width: 5, height: 5, borderRadius: '50%',
                      background: 'rgba(238,238,245,.3)',
                      animation: `bounce .8s ${d * .15}s ease infinite alternate`,
                      display: 'inline-block',
                    }}/>
                  ))}
                </span>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid rgba(238,238,245,.06)',
        padding: '12px 16px',
        display: 'flex', gap: 10,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Sua pergunta sobre a análise..."
          style={{
            flex: 1,
            background: 'rgba(238,238,245,.04)',
            border: '1px solid rgba(238,238,245,.08)',
            borderRadius: 8, padding: '9px 14px',
            fontSize: 13, color: '#eeeef5',
            outline: 'none',
          }}
        />
        <button
          onClick={() => send()}
          disabled={loading || !input.trim()}
          style={{
            background: loading || !input.trim() ? 'rgba(238,238,245,.06)' : ACCENT,
            color: loading || !input.trim() ? 'rgba(238,238,245,.25)' : '#07070f',
            border: 'none', borderRadius: 8,
            padding: '9px 18px',
            fontFamily: SYNE, fontWeight: 700, fontSize: 13,
            cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
            transition: 'all .2s',
          }}
        >
          {loading ? '...' : 'Enviar'}
        </button>
      </div>

      <style>{`
        @keyframes bounce {
          from { transform: translateY(0) }
          to   { transform: translateY(-4px) }
        }
      `}</style>
    </div>
  )
}
