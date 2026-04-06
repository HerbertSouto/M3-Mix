const SYNE = 'var(--font-syne), sans-serif'

const STEPS: Record<string, {
  step: number; label: string; icon: string; color: string; bg: string; border: string
}> = {
  'Situação': {
    step: 1, label: 'Situação', icon: '◎',
    color: '#60a5fa', bg: 'rgba(96,165,250,.05)', border: 'rgba(96,165,250,.18)',
  },
  'Diagnóstico por canal': {
    step: 2, label: 'Diagnóstico', icon: '⊞',
    color: '#a78bfa', bg: 'rgba(167,139,250,.05)', border: 'rgba(167,139,250,.18)',
  },
  'Interpretação': {
    step: 3, label: 'Interpretação', icon: '⟳',
    color: '#34d399', bg: 'rgba(52,211,153,.05)', border: 'rgba(52,211,153,.18)',
  },
  'Ação recomendada': {
    step: 4, label: 'Ação', icon: '↗',
    color: '#e4ff1a', bg: 'rgba(228,255,26,.04)', border: 'rgba(228,255,26,.2)',
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
  const isNumbered = lines.length > 0 && lines.every(l => /^\d+\./.test(l.trim()))
  const isBullet = lines.length > 0 && lines.every(l => /^[-•]/.test(l.trim()))

  const clean = (s: string) => s
    .replace(/^\d+\.\s*/, '')
    .replace(/^[-•]\s*/, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .trim()

  if (isNumbered || isBullet) {
    return (
      <ol style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: 0, padding: 0, listStyle: 'none' }}>
        {lines.map((line, i) => (
          <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {isNumbered && (
              <span style={{
                flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
                border: `1px solid ${color}40`,
                background: `${color}12`,
                color, fontSize: 10, fontWeight: 700,
                fontFamily: SYNE,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginTop: 2,
              }}>
                {i + 1}
              </span>
            )}
            {isBullet && (
              <span style={{
                flexShrink: 0, width: 5, height: 5, borderRadius: '50%',
                background: color, marginTop: 8,
              }}/>
            )}
            <span style={{ fontSize: 13, color: 'rgba(238,238,245,.7)', lineHeight: 1.65 }}>
              {clean(line)}
            </span>
          </li>
        ))}
      </ol>
    )
  }

  return (
    <p style={{ fontSize: 13, color: 'rgba(238,238,245,.65)', lineHeight: 1.75, margin: 0 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {sections.map((section, idx) => {
        const cfg = STEPS[section.title] ?? {
          step: idx + 1, label: section.title, icon: '·',
          color: 'rgba(238,238,245,.5)',
          bg: 'rgba(238,238,245,.03)',
          border: 'rgba(238,238,245,.08)',
        }
        const isLast = idx === sections.length - 1

        return (
          <div key={section.title} style={{ display: 'flex', gap: 0 }}>
            {/* Left: step indicator + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 48, flexShrink: 0 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: `1.5px solid ${cfg.border}`,
                background: cfg.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, zIndex: 1,
              }}>
                <span style={{ fontSize: 13, color: cfg.color, fontFamily: SYNE, fontWeight: 800 }}>
                  {cfg.step}
                </span>
              </div>
              {!isLast && (
                <div style={{
                  width: 1, flexGrow: 1, minHeight: 24,
                  background: `linear-gradient(to bottom, ${cfg.color}30, transparent)`,
                  marginTop: 4,
                }}/>
              )}
            </div>

            {/* Right: content card */}
            <div style={{ flex: 1, paddingBottom: isLast ? 0 : 20, paddingLeft: 4 }}>
              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 12, height: 36,
              }}>
                <span style={{ fontSize: 11, color: cfg.color, fontFamily: SYNE, fontWeight: 700, letterSpacing: '.06em' }}>
                  {cfg.label.toUpperCase()}
                </span>
                <div style={{ flex: 1, height: 1, background: `${cfg.color}18` }}/>
              </div>

              {/* Content */}
              <div style={{
                background: cfg.bg,
                border: `1px solid ${cfg.border}`,
                borderRadius: 12,
                padding: '18px 20px',
                marginBottom: 8,
              }}>
                {renderBody(section.body, cfg.color)}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
