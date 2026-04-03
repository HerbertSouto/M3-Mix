const SYNE = 'var(--font-syne), sans-serif'

const SECTION_CONFIG: Record<string, {
  icon: string; label: string; color: string; bg: string; border: string
}> = {
  'Resumo Executivo': {
    icon: '→', label: 'Resumo',
    color: '#60a5fa', bg: 'rgba(96,165,250,.06)', border: 'rgba(96,165,250,.2)',
  },
  'Pontos de Atenção': {
    icon: '!', label: 'Atenção',
    color: '#fb923c', bg: 'rgba(251,146,60,.06)', border: 'rgba(251,146,60,.2)',
  },
  'Recomendações': {
    icon: '↗', label: 'Ações',
    color: '#34d399', bg: 'rgba(52,211,153,.06)', border: 'rgba(52,211,153,.2)',
  },
}

function parseNarrative(text: string) {
  const sections: { title: string; body: string }[] = []
  const lines = text.split('\n')
  let current: { title: string; body: string } | null = null
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) sections.push(current)
      current = { title: line.replace('## ', '').trim(), body: '' }
    } else if (current) {
      current.body += (current.body ? '\n' : '') + line
    }
  }
  if (current) sections.push(current)
  return sections
}

function renderBody(body: string, color: string) {
  const lines = body.split('\n').filter(l => l.trim())
  const isNumbered = lines.every(l => /^\d+\./.test(l.trim()))

  if (isNumbered) {
    return (
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {lines.map((line, i) => {
          const text = line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')
          return (
            <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                border: `1px solid ${color}40`,
                background: `${color}12`,
                color, fontSize: 10, fontWeight: 700,
                fontFamily: SYNE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 1,
              }}>
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: 'rgba(238,238,245,.7)', lineHeight: 1.6 }}>
                {text}
              </span>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <p style={{ fontSize: 13, color: 'rgba(238,238,245,.65)', lineHeight: 1.7 }}>
      {lines.join(' ').replace(/\*\*(.*?)\*\*/g, '$1')}
    </p>
  )
}

interface Props { narrative: string }

export function NarrativePanel({ narrative }: Props) {
  const sections = parseNarrative(narrative)

  if (sections.length === 0) {
    return (
      <div style={{
        border: '1px solid rgba(238,238,245,.08)',
        borderRadius: 12, padding: 20,
        background: 'rgba(238,238,245,.03)',
        fontSize: 13, color: 'rgba(238,238,245,.6)',
        lineHeight: 1.7, whiteSpace: 'pre-wrap',
      }}>
        {narrative}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
      {sections.map(section => {
        const cfg = SECTION_CONFIG[section.title] ?? {
          icon: '·', label: section.title,
          color: 'rgba(238,238,245,.5)',
          bg: 'rgba(238,238,245,.03)',
          border: 'rgba(238,238,245,.08)',
        }
        return (
          <div key={section.title} style={{
            background: cfg.bg,
            border: `1px solid ${cfg.border}`,
            borderRadius: 12,
            padding: '20px',
          }}>
            {/* Card header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: `${cfg.color}18`,
                border: `1px solid ${cfg.color}35`,
                color: cfg.color,
                fontFamily: SYNE, fontWeight: 800, fontSize: 11,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cfg.icon}
              </span>
              <h3 style={{
                fontFamily: SYNE, fontWeight: 700, fontSize: 13,
                color: cfg.color, letterSpacing: '-.01em',
              }}>
                {cfg.label}
              </h3>
            </div>
            {renderBody(section.body, cfg.color)}
          </div>
        )
      })}
    </div>
  )
}
