'use client'
import { useState } from 'react'

const ACCENT = '#e4ff1a'
const SYNE   = 'var(--font-syne), sans-serif'

interface Props {
  headers: string[]
  onAnalyze: (channels: string[]) => void
  loading: boolean
}

export function CsvPreview({ headers, onAnalyze, loading }: Props) {
  const detectedChannels = headers.filter(h => h.endsWith('_spend'))
  const controlColumns = headers.filter(h =>
    !h.endsWith('_spend') && h !== 'date' && h !== 'revenue'
  )
  const [selected, setSelected] = useState<string[]>(detectedChannels)

  const toggle = (ch: string) =>
    setSelected(prev =>
      prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch]
    )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Channel columns */}
      <div>
        <p style={{
          fontSize: 10, color: 'rgba(238,238,245,.35)',
          letterSpacing: '.07em', fontWeight: 600,
          textTransform: 'uppercase', marginBottom: 10,
        }}>
          Canais de mídia
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {detectedChannels.map(h => {
            const isSelected = selected.includes(h)
            return (
              <button
                key={h}
                onClick={() => toggle(h)}
                style={{
                  border: `1px solid ${isSelected ? `${ACCENT}70` : 'rgba(238,238,245,.1)'}`,
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: isSelected ? ACCENT : 'rgba(238,238,245,.4)',
                  background: isSelected ? `${ACCENT}0f` : 'rgba(238,238,245,.03)',
                  cursor: 'pointer',
                  transition: 'all .15s',
                }}
              >
                {h}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 11, color: 'rgba(238,238,245,.25)', marginTop: 8 }}>
          {selected.length} canal{selected.length !== 1 ? 'is' : ''} selecionado{selected.length !== 1 ? 's' : ''} para análise
        </p>
      </div>

      {/* Control variables */}
      {controlColumns.length > 0 && (
        <div>
          <p style={{
            fontSize: 10, color: 'rgba(238,238,245,.35)',
            letterSpacing: '.07em', fontWeight: 600,
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Variáveis de controle detectadas
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {controlColumns.map(h => (
              <span
                key={h}
                style={{
                  border: '1px solid rgba(99,102,241,.3)',
                  borderRadius: 6,
                  padding: '4px 10px',
                  fontSize: 11,
                  fontFamily: 'var(--font-geist-mono), monospace',
                  color: 'rgba(165,180,252,.7)',
                  background: 'rgba(99,102,241,.06)',
                }}
              >
                {h}
              </span>
            ))}
          </div>
          <p style={{ fontSize: 11, color: 'rgba(238,238,245,.2)', marginTop: 8 }}>
            Usadas automaticamente para isolar o efeito real da mídia
          </p>
        </div>
      )}

      {/* CTA button */}
      <button
        onClick={() => onAnalyze(selected)}
        disabled={selected.length === 0 || loading}
        style={{
          width: '100%',
          background: selected.length === 0 || loading ? 'rgba(238,238,245,.06)' : ACCENT,
          color: selected.length === 0 || loading ? 'rgba(238,238,245,.25)' : '#07070f',
          border: `1px solid ${selected.length === 0 || loading ? 'rgba(238,238,245,.08)' : 'transparent'}`,
          borderRadius: 8,
          padding: '12px 0',
          fontFamily: SYNE,
          fontWeight: 700,
          fontSize: 14,
          letterSpacing: '-.01em',
          cursor: selected.length === 0 || loading ? 'not-allowed' : 'pointer',
          boxShadow: selected.length > 0 && !loading ? `0 0 28px ${ACCENT}30` : 'none',
          transition: 'all .2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
        }}
      >
        {loading ? (
          <>
            <span style={{
              display: 'inline-block',
              width: 12, height: 12,
              border: '2px solid rgba(238,238,245,.2)',
              borderTopColor: 'rgba(238,238,245,.7)',
              borderRadius: '50%',
              animation: 'spin .7s linear infinite',
            }}/>
            Enviando...
          </>
        ) : (
          'Rodar análise MMM →'
        )}
      </button>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
