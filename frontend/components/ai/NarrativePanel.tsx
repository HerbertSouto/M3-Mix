import { Card, CardContent } from '@/components/ui/card'

interface Props {
  narrative: string
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

const SECTION_CONFIG: Record<string, { icon: string; accent: string; bg: string }> = {
  'Resumo Executivo':    { icon: '📊', accent: 'border-blue-500/30',   bg: 'bg-blue-500/5'   },
  'Pontos de Atenção':  { icon: '⚠️',  accent: 'border-amber-500/30',  bg: 'bg-amber-500/5'  },
  'Recomendações':      { icon: '💡', accent: 'border-emerald-500/30', bg: 'bg-emerald-500/5' },
}

function renderBody(body: string) {
  const lines = body.split('\n').filter(l => l.trim())
  const isNumbered = lines.every(l => /^\d+\./.test(l.trim()))

  if (isNumbered) {
    return (
      <ol className="space-y-2">
        {lines.map((line, i) => {
          const text = line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '$1')
          return (
            <li key={i} className="flex gap-3 text-sm leading-relaxed text-foreground/80">
              <span className="flex-none w-5 h-5 rounded-full bg-foreground/10 text-foreground/60 text-xs flex items-center justify-center font-medium mt-0.5">
                {i + 1}
              </span>
              <span>{text}</span>
            </li>
          )
        })}
      </ol>
    )
  }

  return (
    <p className="text-sm leading-relaxed text-foreground/80">
      {lines.join(' ').replace(/\*\*(.*?)\*\*/g, '$1')}
    </p>
  )
}

export function NarrativePanel({ narrative }: Props) {
  const sections = parseNarrative(narrative)

  if (sections.length === 0) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{narrative}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Análise do Copilot
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {sections.map((section) => {
          const config = SECTION_CONFIG[section.title] ?? {
            icon: '📋',
            accent: 'border-border',
            bg: 'bg-muted/30',
          }
          return (
            <Card key={section.title} className={`border ${config.accent} ${config.bg}`}>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-base">{config.icon}</span>
                  <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                </div>
                {renderBody(section.body)}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
