import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

const SYNE = 'var(--font-syne), sans-serif'

const CHANNEL_COLORS: Record<string, string> = {
  tv:     '#3b82f6',
  search: '#10b981',
  social: '#8b5cf6',
  radio:  '#f59e0b',
  ooh:    '#f43f5e',
}

function getColor(ch: string) {
  return CHANNEL_COLORS[ch.replace('_spend', '')] ?? '#94a3b8'
}

function roasColor(v: number) {
  if (v >= 5) return '#34d399'
  if (v >= 2) return '#e4ff1a'
  return '#fb923c'
}

export function ChannelTable({ results }: Props) {
  const { roas, contributions, adstock } = results
  const channels   = Object.keys(roas).sort((a, b) => roas[b] - roas[a])
  const maxContrib = Math.max(...channels.map(ch => contributions[ch] ?? 0))

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
        padding: '14px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <p style={{
            fontFamily: SYNE, fontWeight: 700, fontSize: 14,
            color: '#eeeef5', letterSpacing: '-.01em',
          }}>
            Performance por Canal
          </p>
        </div>
        <div style={{ display: 'flex', gap: 24, fontSize: 10,
          color: 'rgba(238,238,245,.3)', letterSpacing: '.06em', fontWeight: 600 }}>
          <span>ROAS</span>
          <span style={{ width: 48, textAlign: 'right' }}>CONTRIB.</span>
        </div>
      </div>

      {/* Rows */}
      <div style={{ padding: '8px 0' }}>
        {channels.map((ch, i) => {
          const name       = ch.replace('_spend', '')
          const roasVal    = roas[ch]
          const contrib    = (contributions[ch] ?? 0) * 100
          const adstockVal = (adstock[ch] ?? 0) * 100
          const barWidth   = maxContrib > 0 ? ((contributions[ch] ?? 0) / maxContrib) * 100 : 0
          const color      = getColor(ch)

          return (
            <div key={ch} style={{ padding: '12px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                {/* Left: rank + color + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    fontSize: 10, color: 'rgba(238,238,245,.2)',
                    fontFamily: 'var(--font-geist-mono), monospace', width: 14,
                  }}>
                    {i + 1}
                  </span>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: color, flexShrink: 0,
                    boxShadow: `0 0 6px ${color}80`,
                  }}/>
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: '#eeeef5', textTransform: 'capitalize',
                    letterSpacing: '-.01em',
                  }}>
                    {name}
                  </span>
                  {adstockVal > 0 && (
                    <span style={{
                      fontSize: 10, color: 'rgba(238,238,245,.25)',
                      fontFamily: 'var(--font-geist-mono), monospace',
                    }}>
                      α {adstockVal.toFixed(0)}%
                    </span>
                  )}
                </div>

                {/* Right: ROAS + contribution */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                  <span style={{
                    fontFamily: SYNE, fontWeight: 800,
                    fontSize: 15, color: roasColor(roasVal),
                    letterSpacing: '-.02em',
                  }}>
                    {roasVal.toFixed(2)}x
                  </span>
                  <span style={{
                    fontSize: 13, color: 'rgba(238,238,245,.45)',
                    fontFamily: 'var(--font-geist-mono), monospace',
                    width: 48, textAlign: 'right',
                  }}>
                    {contrib.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div style={{ paddingLeft: 34 }}>
                <div style={{
                  height: 2, borderRadius: 99,
                  background: 'rgba(238,238,245,.06)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', borderRadius: 99,
                    background: color,
                    width: `${barWidth}%`,
                    boxShadow: `0 0 6px ${color}60`,
                  }}/>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
