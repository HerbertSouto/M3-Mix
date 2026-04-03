import { createServerClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { StatusPoller } from '@/components/dashboard/StatusPoller'
import { SummaryCards } from '@/components/dashboard/SummaryCards'
import { DecompositionChart } from '@/components/dashboard/DecompositionChart'
import { ChannelTable } from '@/components/dashboard/ChannelTable'
import { SaturationCurves } from '@/components/dashboard/SaturationCurves'
import { NarrativePanel } from '@/components/ai/NarrativePanel'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { AnalysisResults } from '@/lib/types'
import Link from 'next/link'

interface Props {
  params: Promise<{ id: string }>
}

function SectionHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{
        fontFamily: 'var(--font-syne), sans-serif',
        fontWeight: 700, fontSize: 18,
        letterSpacing: '-.02em', marginBottom: 4,
        color: '#eeeef5',
      }}>
        {title}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(238,238,245,.38)', lineHeight: 1.5 }}>{sub}</p>
    </div>
  )
}

export default async function AnalysisPage({ params }: Props) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: analysis } = await supabase
    .from('analyses')
    .select('*')
    .eq('id', id)
    .single()

  if (!analysis) notFound()

  if (analysis.status === 'processing') {
    return <StatusPoller analysisId={id} />
  }

  if (analysis.status === 'failed') {
    return (
      <div className="dark" style={{
        minHeight: '100vh', background: '#07070f',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, color: '#eeeef5',
      }}>
        <p style={{ color: '#f87171', fontWeight: 600 }}>A análise falhou.</p>
        <Link href="/" style={{
          fontSize: 13, color: 'rgba(238,238,245,.4)',
          textDecoration: 'underline',
        }}>
          Tentar novamente
        </Link>
      </div>
    )
  }

  const { data: results } = await supabase
    .from('analysis_results')
    .select('*')
    .eq('analysis_id', id)
    .single()

  if (!results) notFound()

  const typedResults = results as AnalysisResults

  const saturationSummary = Object.fromEntries(
    Object.entries(typedResults.saturation).map(([ch, points]) => {
      const pts = points as { x: number; y: number }[]
      const maxY = Math.max(...pts.map(p => p.y))
      const satPoint = pts.find(p => p.y >= maxY * 0.9)
      const maxSpend = Math.max(...pts.map(p => p.x))
      const currentEst = maxSpend / 1.5
      return [ch, {
        satura_em_spend: satPoint ? Math.round(satPoint.x) : null,
        spend_atual_estimado: Math.round(currentEst),
        saturado: satPoint ? currentEst >= satPoint.x : false,
      }]
    })
  )

  // Summarise decomposition: total revenue contribution per channel
  const decompositionSummary = typedResults.decomposition.reduce<Record<string, number>>((acc, pt) => {
    acc[pt.channel] = (acc[pt.channel] ?? 0) + pt.value
    return acc
  }, {})

  const createdAt = new Date(analysis.created_at).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  })

  const ACCENT = '#e4ff1a'

  return (
    <div className="dark" style={{
      minHeight: '100vh',
      background: '#09090f',
      color: '#eeeef5',
    }}>
      {/* Background dot grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle,rgba(238,238,245,.04) 1px,transparent 1px)',
        backgroundSize: '28px 28px',
      }}/>

      {/* ── HEADER ── */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(9,9,15,.85)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(238,238,245,.06)',
        padding: '14px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/" style={{
            fontSize: 12, color: 'rgba(238,238,245,.3)',
            textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            ← início
          </Link>
          <div style={{ width: 1, height: 20, background: 'rgba(238,238,245,.08)' }}/>
          <div>
            <p style={{
              fontSize: 10, color: 'rgba(238,238,245,.3)',
              letterSpacing: '.08em', fontWeight: 600, textTransform: 'uppercase',
            }}>
              Relatório MMM
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 2 }}>
              {analysis.channels.map((c: string, i: number) => (
                <span key={c} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 12, color: 'rgba(238,238,245,.55)', textTransform: 'capitalize',
                }}>
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: ['#3b82f6','#10b981','#8b5cf6','#f59e0b','#f43f5e'][i % 5],
                    display: 'inline-block',
                  }}/>
                  {c.replace('_spend', '')}
                </span>
              ))}
              <span style={{ fontSize: 11, color: 'rgba(238,238,245,.2)' }}>· {createdAt}</span>
            </div>
          </div>
        </div>

        <Link href={`/analysis/${id}/optimize`} style={{
          background: ACCENT, color: '#07070f',
          border: 'none', borderRadius: 7,
          padding: '8px 18px',
          fontFamily: 'var(--font-syne), sans-serif',
          fontWeight: 700, fontSize: 13,
          cursor: 'pointer', letterSpacing: '-.01em',
          textDecoration: 'none', display: 'inline-block',
          boxShadow: `0 0 24px ${ACCENT}30`,
        }}>
          Otimizar Budget →
        </Link>
      </header>

      {/* ── CONTENT ── */}
      <main style={{
        position: 'relative', zIndex: 1,
        maxWidth: 1200, margin: '0 auto',
        padding: '48px 40px 96px',
        display: 'flex', flexDirection: 'column', gap: 56,
      }}>

        {/* 1. KPIs */}
        <section>
          <SectionHeader
            title="Os números que mais importam"
            sub="Cada R$1 que você investe em mídia — quanto voltou, qual canal funcionou melhor e quanto da sua receita vem dos seus anúncios."
          />
          <SummaryCards results={typedResults} />
        </section>

        {/* 2. AI Narrative — recomendações primeiro */}
        <section>
          <SectionHeader
            title="A história dos seus dados"
            sub="Da situação geral ao diagnóstico por canal — o modelo leu os números e construiu uma narrativa de decisão para o seu negócio."
          />
          <NarrativePanel narrative={typedResults.ai_narrative} />
        </section>

        {/* 3. Channel performance */}
        <section>
          <SectionHeader
            title="Performance por canal"
            sub="ROAS = para cada R$1 investido, quanto voltou em receita. Contribuição = % da receita total que veio deste canal."
          />
          <ChannelTable results={typedResults} />
        </section>

        {/* 4. Revenue over time */}
        <section>
          <SectionHeader
            title="Como sua receita foi construída"
            sub="O gráfico empilhado mostra quanto cada canal contribuiu semana a semana. A camada cinza é a receita que aconteceria mesmo sem mídia paga (baseline)."
          />
          <DecompositionChart decomposition={typedResults.decomposition} />
        </section>

        {/* 5. Saturation */}
        <section>
          <SectionHeader
            title="Onde ainda há espaço para crescer"
            sub="A curva de saturação mostra o retorno marginal de cada canal: quando a curva achata, investir mais naquele canal começa a render menos."
          />
          <SaturationCurves
            saturation={typedResults.saturation}
            channels={analysis.channels}
          />
        </section>

        {/* 6. Chat */}
        <section>
          <SectionHeader
            title="Pergunte ao Copilot"
            sub="Tem dúvidas sobre os resultados? O assistente conhece toda a sua análise e pode responder em linguagem simples."
          />
          <ChatPanel
            analysisId={id}
            analysisContext={{
              roas: typedResults.roas,
              contributions: typedResults.contributions,
              adstock: typedResults.adstock,
              budget_recommendation: typedResults.budget_recommendation,
              saturation: saturationSummary,
              decomposition_por_canal: decompositionSummary,
              relatorio_ia: typedResults.ai_narrative,
            }}
          />
        </section>

      </main>
    </div>
  )
}
