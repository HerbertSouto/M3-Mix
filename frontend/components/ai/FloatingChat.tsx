'use client'
import { useState, useRef, useEffect } from 'react'

function getOrCreateSessionId(): string {
  const key = 'm3_session_id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem(key, id)
  }
  return id
}

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
  const [limited, setLimited]   = useState(false)
  const bottomRef               = useRef<HTMLDivElement>(null)
  const inputRef                = useRef<HTMLInputElement>(null)
  const sessionIdRef            = useRef<string | null>(null)

  useEffect(() => {
    sessionIdRef.current = getOrCreateSessionId()
  }, [])

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
        session_id: sessionIdRef.current,
      }),
    })

    if (res.status === 429) {
      setLimited(true)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Você atingiu o limite de perguntas desta sessão. Para continuar, abra uma nova análise.' }])
      setLoading(false)
      return
    }

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
            onKeyDown={e => e.key === 'Enter' && !limited && send()}
            disabled={limited}
            placeholder={limited ? 'Limite de perguntas atingido — abra uma nova análise' : 'Pergunte sobre a análise...'}
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
            disabled={loading || !input.trim() || limited}
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
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 50 }}>
        <style>{`
          @keyframes m3-pulse {
            0%   { transform: scale(1);   opacity: .5; }
            100% { transform: scale(1.7); opacity: 0;  }
          }
          @keyframes m3-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
          }
          .m3-fab:hover { transform: scale(1.08) !important; }
          .m3-fab:active { transform: scale(0.95) !important; }
        `}</style>

        {/* Pulse ring — only when closed */}
        {!open && (
          <>
            <div style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%',
              border: `1.5px solid ${ACCENT}`,
              animation: 'm3-pulse 2s ease-out infinite',
              pointerEvents: 'none',
            }}/>
            <div style={{
              position: 'absolute', inset: -6,
              borderRadius: '50%',
              border: `1.5px solid ${ACCENT}`,
              animation: 'm3-pulse 2s ease-out infinite .8s',
              pointerEvents: 'none',
            }}/>
          </>
        )}

        <button
          className="m3-fab"
          onClick={() => setOpen(o => !o)}
          style={{
            position: 'relative',
            width: 56, height: 56, borderRadius: '50%',
            background: open
              ? '#1a1a2e'
              : `conic-gradient(from 180deg, ${ACCENT}, #a3e635, ${ACCENT})`,
            border: open ? `1px solid rgba(238,238,245,.15)` : 'none',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: open
              ? 'inset 0 0 0 1px rgba(255,255,255,.06)'
              : `0 0 0 1px ${ACCENT}30, 0 8px 32px ${ACCENT}50, 0 2px 8px rgba(0,0,0,.4)`,
            transition: 'all .25s cubic-bezier(.34,1.56,.64,1)',
          }}
        >
          {open ? (
            /* × close icon */
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3l10 10M13 3L3 13" stroke="rgba(238,238,245,.4)" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            /* Spark / AI icon */
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
                fill="#07070f" stroke="#07070f" strokeWidth=".5" strokeLinejoin="round"/>
              <path d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z"
                fill="#07070f" opacity=".7"/>
            </svg>
          )}

          {!open && unread > 0 && (
            <span style={{
              position: 'absolute', top: 0, right: 0,
              width: 17, height: 17, borderRadius: '50%',
              background: '#f43f5e', color: '#fff',
              fontSize: 9, fontWeight: 700, fontFamily: SYNE,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid #09090f',
              boxShadow: '0 2px 8px #f43f5e80',
            }}>
              {unread}
            </span>
          )}
        </button>
      </div>
    </>
  )
}
