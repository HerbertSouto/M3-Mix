import { AnalysisResults } from '@/lib/types'

interface Props {
  results: AnalysisResults
}

const ACCENT = '#e4ff1a'
const SYNE   = 'var(--font-syne), sans-serif'

function roasLabel(v: number): { text: string; color: string } {
  if (v >= 5) return { text: 'Excelente', color: '#34d399' }
  if (v >= 2) return { text: 'Bom',       color: ACCENT }
  return        { text: 'Atenção',         color: '#fb923c' }
}

interface CardProps {
  eyebrow: string
  value: string
  meaning: string
  badge?: { text: string; color: string }
  accentColor: string
}

function StatCard({ eyebrow, value, meaning, badge, accentColor }: CardProps) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: 'rgba(238,238,245,.03)',
      border: '1px solid rgba(238,238,245,.08)',
      borderRadius: 14,
      padding: '24px 24px 20px',
    }}>
      {/* Top accent line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: accentColor, opacity: 0.6,
      }}/>

      <p style={{
        fontSize: 10, color: 'rgba(238,238,245,.35)',
        letterSpacing: '.08em', fontWeight: 600,
        textTransform: 'uppercase', marginBottom: 12,
      }}>
        {eyebrow}
      </p>

      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
        <p style={{
          fontFamily: SYNE, fontWeight: 800,
          fontSize: 'clamp(28px,3.5vw,40px)',
          letterSpacing: '-.03em', lineHeight: 1,
          color: '#eeeef5',
        }}>
          {value}
        </p>
        {badge && (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: badge.color,
            border: `1px solid ${badge.color}40`,
            background: `${badge.color}12`,
            borderRadius: 99, padding: '3px 9px',
            letterSpacing: '.04em',
          }}>
            {badge.text}
          </span>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'rgba(238,238,245,.35)', lineHeight: 1.5 }}>
        {meaning}
      </p>
    </div>
  )
}

export function SummaryCards({ results }: Props) {
  const { roas, contributions } = results
  const channels      = Object.keys(roas)
  const topChannel    = [...channels].sort((a, b) => roas[b] - roas[a])[0]
  const avgRoas       = channels.reduce((s, ch) => s + roas[ch], 0) / channels.length
  const incrementalShare = 1 - (contributions.baseline ?? 0)
  const roasBadge     = roasLabel(avgRoas)
  const topRoas       = roas[topChannel]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
      <StatCard
        eyebrow="ROAS Médio"
        value={`${avgRoas.toFixed(2)}x`}
        meaning={`Para cada R$1 investido em mídia, você obteve em média R$${avgRoas.toFixed(2)} de retorno em receita.`}
        badge={roasBadge}
        accentColor="#3b82f6"
      />
      <StatCard
        eyebrow="Canal Mais Eficiente"
        value={topChannel?.replace('_spend', '')}
        meaning={`${topChannel?.replace('_spend','')} entregou ROAS de ${topRoas?.toFixed(2)}x — o maior retorno entre todos os canais analisados.`}
        badge={{ text: `${topRoas?.toFixed(1)}x ROAS`, color: '#34d399' }}
        accentColor="#34d399"
      />
      <StatCard
        eyebrow="Receita Incremental"
        value={`${(incrementalShare * 100).toFixed(1)}%`}
        meaning={`${(incrementalShare * 100).toFixed(1)}% da sua receita total foi gerada pelos canais de mídia. Os outros ${(100 - incrementalShare * 100).toFixed(1)}% viriam de qualquer forma (orgânico, marca, sazonalidade).`}
        accentColor="#8b5cf6"
      />
    </div>
  )
}
