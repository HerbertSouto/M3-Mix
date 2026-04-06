'use client'
import { useState, useRef, useEffect } from 'react'

const ACCENT = '#e4ff1a'
const SYNE   = 'var(--font-syne), sans-serif'

const SUGGESTIONS = [
  'Qual canal devo aumentar o investimento?',
  'Meu ROAS está bom?',
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

export function FloatingChat({ analysisId, analysisContext }: Props) {
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [unread, setUnread]     = useState(0)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    if (!open && messages.at(-1)?.role === 'assistant') {
      setUnread(n => n + 1)
    }
  }, [messages, open])

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
          content = 'Não consegui gerar uma resposta agora. Tente novamente.'
          setMessages(prev => {
            const u = [...prev]; u[u.length - 1] = { role: 'assistant', content }; return u
          })
          break
        }
        content += t
        setMessages(prev => {
          const u = [...prev]; u[u.length - 1] = { role: 'assistant', content }; return u
        })
      }
    }
    setLoading(false)
  }

  return (
    <>
      {/* Floating panel */}
      <div style={{
        position: 'fixed', bottom: 88, right: 28, zIndex: 50,
        width: 380,
        borderRadius: 16,
        border: '1px solid rgba(238,238,245,.1)',
        background: '#0e0e1a',
        boxShadow: '0 24px 64px rgba(0,0,0,.6)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        transformOrigin: 'bottom right',
        transform: open ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'all' : 'none',
        transition: 'transform .22s cubic-bezier(.34,1.56,.64,1), opacity .18s ease',
        maxHeight: 520,
      }}>
        {/* macOS header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(238,238,245,.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['#ff5f57','#ffbd2e','#28c840'].map(c => (
              <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: .5 }}/>
            ))}
            <span style={{ fontSize: 10, color: 'rgba(238,238,245,.3)', letterSpacing: '.07em', fontWeight: 600, marginLeft: 4 }}>
              M3 ASSISTENTE
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            style={{ background: 'none', border: 'none', color: 'rgba(238,238,245,.25)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}
          >
            ×
          </button>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '16px 16px 8px',
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {messages.length === 0 && (
            <div>
              <p style={{ fontSize: 12, color: 'rgba(238,238,245,.3)', marginBottom: 12, lineHeight: 1.5 }}>
                Pergunte sobre qualquer parte do relatório. O Copilot conhece seus dados.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)} style={{
                    fontSize: 11, color: 'rgba(238,238,245,.45)',
                    border: '1px solid rgba(238,238,245,.1)',
                    background: 'rgba(238,238,245,.03)',
                    borderRadius: 99, padding: '4px 10px',
                    cursor: 'pointer',
                  }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '85%',
                borderRadius: m.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                padding: '9px 13px',
                fontSize: 13, lineHeight: 1.6,
                background: m.role === 'user' ? `${ACCENT}18` : 'rgba(238,238,245,.06)',
                border: m.role === 'user' ? `1px solid ${ACCENT}30` : '1px solid rgba(238,238,245,.08)',
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
          padding: '10px 12px',
          display: 'flex', gap: 8, flexShrink: 0,
        }}>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && send()}
            placeholder="Pergunte sobre a análise..."
            style={{
              flex: 1,
              background: 'rgba(238,238,245,.04)',
              border: '1px solid rgba(238,238,245,.08)',
              borderRadius: 8, padding: '8px 12px',
              fontSize: 13, color: '#eeeef5', outline: 'none',
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? 'rgba(238,238,245,.06)' : ACCENT,
              color: loading || !input.trim() ? 'rgba(238,238,245,.25)' : '#07070f',
              border: 'none', borderRadius: 8,
              padding: '8px 16px',
              fontFamily: SYNE, fontWeight: 700, fontSize: 13,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all .2s', flexShrink: 0,
            }}
          >
            {loading ? '...' : '↑'}
          </button>
        </div>
      </div>

      {/* Trigger button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 28, right: 28, zIndex: 50,
          width: 52, height: 52, borderRadius: '50%',
          background: open ? 'rgba(238,238,245,.08)' : ACCENT,
          border: open ? '1px solid rgba(238,238,245,.12)' : 'none',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: open ? 'none' : `0 0 32px ${ACCENT}40`,
          transition: 'all .2s',
          fontSize: 20,
        }}
      >
        {open ? (
          <span style={{ color: 'rgba(238,238,245,.4)', fontSize: 18, lineHeight: 1 }}>×</span>
        ) : (
          <span style={{ fontSize: 20 }}>💬</span>
        )}
        {!open && unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            width: 18, height: 18, borderRadius: '50%',
            background: '#f43f5e', color: '#fff',
            fontSize: 10, fontWeight: 700, fontFamily: SYNE,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid #09090f',
          }}>
            {unread}
          </span>
        )}
      </button>
    </>
  )
}
