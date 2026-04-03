'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/UploadZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { uploadCsv } from '@/lib/api'

const ACCENT = '#e4ff1a'
const BG     = '#07070f'
const SYNE   = 'var(--font-syne), sans-serif'
const MONO   = 'var(--font-geist-mono), monospace'

const PREVIEW_CHANNELS = [
  { name: 'Social',  roas: 3.01, bar: 78, color: '#10b981', status: 'Pode escalar' },
  { name: 'Search',  roas: 2.66, bar: 62, color: '#60a5fa', status: 'Pode escalar' },
  { name: 'TV',      roas: 1.11, bar: 26, color: '#8b5cf6', status: 'Saturado' },
]

const FEATURES = [
  {
    n: '01',
    title: 'Modelo Bayesiano',
    body: 'PyMC-Marketing com adstock geométrico e saturação logística. Estimativas com incerteza real — não atribuição de last-click.',
    color: ACCENT,
    glow: '#e4ff1a',
  },
  {
    n: '02',
    title: 'Narrativa com IA',
    body: 'LLaMA 3.3 70B via Groq lê seus resultados e escreve um relatório executivo com pontos de atenção e recomendações acionáveis.',
    color: '#60a5fa',
    glow: '#60a5fa',
  },
  {
    n: '03',
    title: 'Otimização de Budget',
    body: 'Simule realocações de verba com um slider e veja o impacto projetado na receita. Descubra onde cada real rende mais.',
    color: '#34d399',
    glow: '#34d399',
  },
]

export default function HomePage() {
  const router    = useRouter()
  const uploadRef  = useRef<HTMLDivElement>(null)
  const sampleRef  = useRef<HTMLDivElement>(null)
  const [file, setFile]       = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)

  const handleFile = (f: File, h: string[]) => {
    setFile(f); setHeaders(h); setError(null)
  }

  const handleAnalyze = async (channels: string[]) => {
    if (!file) return
    setLoading(true)
    try {
      const { analysis_id } = await uploadCsv(file, channels)
      router.push(`/analysis/${analysis_id}`)
    } catch {
      setError('Erro ao enviar arquivo. Tente novamente.')
      setLoading(false)
    }
  }

  const scrollToUpload = () =>
    uploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })

  return (
    <div className="dark" style={{ minHeight: '100vh', background: BG, color: '#eeeef5', overflowX: 'hidden' }}>

      {/* ── BACKGROUND LAYERS ── */}
      {/* Fine dot grid */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle, rgba(238,238,245,.04) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}/>
      {/* Top-center accent glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 55% 30% at 50% -2%, ${ACCENT}18 0%, transparent 70%)`,
      }}/>
      {/* Bottom-right deep blue glow */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 45% 40% at 95% 100%, #3b82f614 0%, transparent 70%)',
      }}/>

      {/* ── NAV ── */}
      <nav className="m3-nav" style={{
        position: 'relative', zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 48px',
        borderBottom: '1px solid rgba(238,238,245,.06)',
        backdropFilter: 'blur(12px)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            border: `1.5px solid ${ACCENT}40`,
            background: `${ACCENT}0c`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="0.5" y="7.5"  width="3" height="6"  rx=".6" fill={ACCENT} opacity=".9"/>
              <rect x="5.5" y="4.5"  width="3" height="9"  rx=".6" fill={ACCENT} opacity=".65"/>
              <rect x="10.5" y="1.5" width="3" height="12" rx=".6" fill={ACCENT} opacity=".4"/>
            </svg>
          </div>
          <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 17, letterSpacing: '-.025em' }}>
            M3-Mix
          </span>
        </div>

        {/* Tech stack pills */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {(['PyMC', 'Groq', 'Supabase'] as const).map((t, i) => (
            <span key={t} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 10, color: 'rgba(238,238,245,.3)',
              border: '1px solid rgba(238,238,245,.07)',
              borderRadius: 99, padding: '4px 10px',
              fontFamily: MONO,
              background: 'rgba(238,238,245,.02)',
            }}>
              <span style={{
                width: 4, height: 4, borderRadius: '50%',
                background: [ACCENT, '#60a5fa', '#34d399'][i],
                display: 'inline-block',
              }}/>
              {t}
            </span>
          ))}
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '80px 48px 72px',
      }}>
        <div className="m3-hero-grid" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 420px',
          gap: 64,
          alignItems: 'center',
        }}>

          {/* Left — headline + CTA */}
          <div>
            {/* Badge */}
            <div className="m3-a1" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              border: '1px solid rgba(238,238,245,.09)',
              borderRadius: 99, padding: '5px 14px 5px 10px',
              marginBottom: 32,
              background: 'rgba(238,238,245,.03)',
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: ACCENT,
                animation: 'pulse 2s ease infinite',
                display: 'inline-block',
              }}/>
              <span style={{
                fontSize: 10, color: 'rgba(238,238,245,.5)',
                letterSpacing: '.09em', fontWeight: 600,
                fontFamily: MONO,
              }}>
                MARKETING MIX MODELING COM IA
              </span>
            </div>

            {/* H1 */}
            <h1 className="m3-a2" style={{
              fontFamily: SYNE, fontWeight: 800,
              fontSize: 'clamp(40px, 5.5vw, 72px)',
              lineHeight: 1.0, letterSpacing: '-.035em',
              marginBottom: 24,
            }}>
              Pare de achar.<br/>
              <span style={{
                color: ACCENT,
                textShadow: `0 0 60px ${ACCENT}50`,
              }}>
                Comece a medir.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="m3-a3" style={{
              fontSize: 16, color: 'rgba(238,238,245,.42)',
              lineHeight: 1.7, marginBottom: 40,
              maxWidth: 460,
            }}>
              Suba seu CSV de mídia. Um modelo Bayesiano entrega ROAS real,
              adstock e saturação por canal — com relatório executivo em segundos.
            </p>

            {/* CTAs */}
            <div className="m3-a4" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="m3-cta"
                onClick={scrollToUpload}
                style={{
                  background: ACCENT, color: BG, border: 'none',
                  borderRadius: 8, padding: '12px 28px',
                  fontFamily: SYNE, fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', letterSpacing: '-.01em',
                  boxShadow: `0 0 32px ${ACCENT}30`,
                }}
              >
                Começar análise →
              </button>
              <button
                onClick={() => sampleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                style={{
                  background: 'none', border: '1px solid rgba(238,238,245,.1)',
                  borderRadius: 7, padding: '11px 20px',
                  fontSize: 13, color: 'rgba(238,238,245,.4)',
                  cursor: 'pointer', fontFamily: MONO,
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'border-color .2s, color .2s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(238,238,245,.25)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(238,238,245,.65)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(238,238,245,.1)'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(238,238,245,.4)' }}
              >
                ↓ ver dataset de exemplo
              </button>
            </div>

            {/* Social proof strip */}
            <div className="m3-a5" style={{
              display: 'flex', gap: 24, marginTop: 40,
              borderTop: '1px solid rgba(238,238,245,.06)',
              paddingTop: 24,
            }}>
              {[
                { val: '~2 min',    label: 'tempo de análise' },
                { val: 'Bayesiano', label: 'modelo estatístico' },
                { val: 'Open Source', label: 'código aberto' },
              ].map(({ val, label }) => (
                <div key={label}>
                  <div style={{
                    fontFamily: SYNE, fontWeight: 700, fontSize: 15,
                    color: '#eeeef5', letterSpacing: '-.01em',
                  }}>{val}</div>
                  <div style={{ fontSize: 10, color: 'rgba(238,238,245,.3)', fontFamily: MONO, marginTop: 2 }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — preview card */}
          <div className="m3-preview-card" style={{
            border: '1px solid rgba(238,238,245,.1)',
            borderRadius: 16,
            background: 'rgba(14,14,26,.9)',
            backdropFilter: 'blur(24px)',
            overflow: 'hidden',
            transform: 'rotate(-1.5deg)',
            boxShadow: `0 32px 80px rgba(0,0,0,.6), 0 0 80px ${ACCENT}0c`,
          }}>
            {/* Card header — macOS dots */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid rgba(238,238,245,.06)',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                  <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: .55 }}/>
                ))}
              </div>
              <span style={{
                fontSize: 9, color: 'rgba(238,238,245,.25)',
                letterSpacing: '.09em', fontWeight: 600,
                fontFamily: MONO,
              }}>RELATÓRIO MMM — RESULTADO</span>
            </div>

            {/* Card body */}
            <div style={{ padding: '20px 20px 24px' }}>
              {/* Top metric */}
              <div style={{
                display: 'flex', alignItems: 'baseline', gap: 10,
                marginBottom: 20,
              }}>
                <div>
                  <div style={{
                    fontSize: 9, color: 'rgba(238,238,245,.3)',
                    letterSpacing: '.08em', fontFamily: MONO, marginBottom: 4,
                  }}>ROAS MÉDIO</div>
                  <div style={{
                    fontFamily: SYNE, fontWeight: 800, fontSize: 40,
                    color: ACCENT, lineHeight: 1,
                    textShadow: `0 0 32px ${ACCENT}50`,
                  }}>2.26<span style={{ fontSize: 20, opacity: .7 }}>×</span></div>
                </div>
                <div style={{
                  marginLeft: 'auto',
                  background: `${ACCENT}15`,
                  border: `1px solid ${ACCENT}30`,
                  borderRadius: 99, padding: '3px 10px',
                  fontSize: 10, color: ACCENT,
                  fontFamily: MONO, fontWeight: 600,
                }}>Bom</div>
              </div>

              {/* Channel bars */}
              <div style={{
                fontSize: 9, color: 'rgba(238,238,245,.28)',
                letterSpacing: '.08em', fontFamily: MONO, marginBottom: 12,
              }}>ROAS POR CANAL</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PREVIEW_CHANNELS.map(ch => (
                  <div key={ch.name}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', marginBottom: 5,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: ch.color, display: 'inline-block', flexShrink: 0,
                        }}/>
                        <span style={{
                          fontSize: 11, color: 'rgba(238,238,245,.65)',
                          fontFamily: MONO,
                        }}>{ch.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 9,
                          color: ch.status === 'Saturado' ? '#fb923c' : '#34d399',
                          fontFamily: MONO,
                          border: `1px solid ${ch.status === 'Saturado' ? '#fb923c40' : '#34d39940'}`,
                          borderRadius: 99, padding: '1px 6px',
                        }}>{ch.status}</span>
                        <span style={{
                          fontFamily: SYNE, fontWeight: 700, fontSize: 12,
                          color: ch.color,
                        }}>{ch.roas}×</span>
                      </div>
                    </div>
                    {/* Bar track */}
                    <div style={{
                      height: 3, background: 'rgba(238,238,245,.06)',
                      borderRadius: 99, overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${ch.bar}%`,
                        background: `linear-gradient(90deg, ${ch.color}90, ${ch.color})`,
                        borderRadius: 99,
                      }}/>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer chips */}
              <div style={{
                marginTop: 20,
                paddingTop: 16,
                borderTop: '1px solid rgba(238,238,245,.05)',
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {[
                  '✓ Adstock modelado por canal',
                  '✓ Curvas de saturação calculadas',
                  '✓ Relatório executivo gerado com IA',
                ].map(t => (
                  <div key={t} style={{
                    fontSize: 10, color: 'rgba(238,238,245,.3)',
                    fontFamily: MONO, display: 'flex', alignItems: 'center', gap: 6,
                  }}>{t}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DIVIDER LINE ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(238,238,245,.07) 30%, rgba(238,238,245,.07) 70%, transparent)' }}/>
      </div>

      {/* ── METRICS STRIP ── */}
      <section style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px',
      }}>
        <div className="m3-metrics-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 1,
        }}>
          {[
            { label: 'ROAS', sub: 'retorno por canal sobre o spend real', icon: '◈', color: ACCENT },
            { label: 'Adstock', sub: 'efeito residual de mídia modelado semana a semana', icon: '◎', color: '#60a5fa' },
            { label: 'Saturação', sub: 'curva de retorno marginal por canal de investimento', icon: '◉', color: '#34d399' },
          ].map((m, i) => (
            <div key={m.label} className="m3-metric-item" style={{
              padding: '32px 28px',
              borderRight: i < 2 ? '1px solid rgba(238,238,245,.05)' : 'none',
              display: 'flex', gap: 16, alignItems: 'flex-start',
            }}>
              <div style={{
                fontSize: 22, color: m.color, opacity: .5, lineHeight: 1,
                marginTop: 3, flexShrink: 0,
              }}>{m.icon}</div>
              <div>
                <div style={{
                  fontFamily: SYNE, fontWeight: 800, fontSize: 18,
                  color: m.color, marginBottom: 6, letterSpacing: '-.015em',
                }}>{m.label}</div>
                <div style={{
                  fontSize: 12, color: 'rgba(238,238,245,.3)', lineHeight: 1.6,
                }}>{m.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── DIVIDER ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px',
      }}>
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(238,238,245,.07) 30%, rgba(238,238,245,.07) 70%, transparent)' }}/>
      </div>

      {/* ── UPLOAD ZONE — protagonista ── */}
      <section ref={uploadRef} style={{
        position: 'relative', zIndex: 10,
        maxWidth: 820, margin: '0 auto',
        padding: '72px 48px 80px',
      }}>
        {/* Section label */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <p style={{
            fontSize: 10, color: 'rgba(238,238,245,.3)',
            letterSpacing: '.1em', fontWeight: 600,
            textTransform: 'uppercase', fontFamily: MONO,
            marginBottom: 10,
          }}>comece aqui</p>
          <h2 style={{
            fontFamily: SYNE, fontWeight: 800,
            fontSize: 'clamp(22px, 3vw, 32px)',
            letterSpacing: '-.025em',
          }}>
            Suba seus dados de mídia
          </h2>
        </div>

        <div
          className={`m3-upload-ring${dragging ? ' drag' : ''}`}
          style={{
            border: '1.5px solid rgba(238,238,245,.1)',
            borderRadius: 16,
            background: 'rgba(238,238,245,.022)',
            overflow: 'hidden',
          }}
        >
          {/* Terminal header */}
          <div style={{
            borderBottom: '1px solid rgba(238,238,245,.06)',
            padding: '11px 18px',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{ display: 'flex', gap: 5 }}>
              {['#ff5f57','#ffbd2e','#28c840'].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: .5 }}/>
              ))}
            </div>
            <span style={{
              fontSize: 9, color: 'rgba(238,238,245,.3)',
              letterSpacing: '.07em', fontWeight: 500, fontFamily: MONO,
            }}>
              {file ? file.name.toUpperCase() : 'CARREGAR DADOS — CSV / XLSX'}
            </span>
          </div>

          {/* Content */}
          <div
            style={{ padding: 28 }}
            onDragEnter={() => setDragging(true)}
            onDragLeave={() => setDragging(false)}
            onDrop={() => setDragging(false)}
          >
            {!file ? (
              <UploadZone onFile={handleFile}/>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <CsvPreview headers={headers} onAnalyze={handleAnalyze} loading={loading}/>
                <button onClick={() => { setFile(null); setHeaders([]) }} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 11, color: 'rgba(238,238,245,.3)',
                  textDecoration: 'underline', textAlign: 'left',
                  fontFamily: MONO,
                }}>
                  trocar arquivo
                </button>
              </div>
            )}
            {error && <p style={{ color: '#f87171', fontSize: 12, marginTop: 10 }}>{error}</p>}
          </div>

          {/* Column hints footer */}
          {!file && (
            <div style={{
              borderTop: '1px solid rgba(238,238,245,.05)',
              padding: '16px 20px',
              display: 'flex', flexDirection: 'column', gap: 12,
            }}>
              <p style={{
                fontSize: 9, color: 'rgba(238,238,245,.2)',
                letterSpacing: '.08em', fontWeight: 600,
                textTransform: 'uppercase', fontFamily: MONO,
              }}>
                Colunas necessárias no arquivo
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { col: 'date',     desc: 'Data de cada semana — formato AAAA-MM-DD (ex: 2024-01-07)' },
                  { col: 'revenue',  desc: 'Receita total gerada naquela semana, em R$' },
                  { col: 'tv_spend', desc: 'Investimento por canal de mídia — sufixo _spend obrigatório (ex: tv_spend, search_spend, social_spend)' },
                ].map(({ col, desc }) => (
                  <div key={col} style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                    <code style={{
                      fontSize: 10, color: 'rgba(238,238,245,.5)', flexShrink: 0,
                      background: 'rgba(238,238,245,.05)',
                      border: '1px solid rgba(238,238,245,.07)',
                      borderRadius: 4, padding: '2px 7px',
                      fontFamily: MONO,
                    }}>{col}</code>
                    <span style={{ fontSize: 11, color: 'rgba(238,238,245,.3)', lineHeight: 1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 10, color: 'rgba(238,238,245,.18)', lineHeight: 1.6, fontFamily: MONO }}>
                Outras colunas (promoção, sazonalidade, preço) são detectadas automaticamente como variáveis de controle.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="m3-section" style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px 96px',
      }}>
        {/* Section header */}
        <div style={{ marginBottom: 40 }}>
          <p style={{
            fontSize: 10, color: 'rgba(238,238,245,.3)',
            letterSpacing: '.1em', fontWeight: 600,
            textTransform: 'uppercase', fontFamily: MONO,
            marginBottom: 10,
          }}>o que o modelo entrega</p>
          <h2 style={{
            fontFamily: SYNE, fontWeight: 800,
            fontSize: 'clamp(22px, 3vw, 34px)',
            letterSpacing: '-.025em',
          }}>
            Ciência de dados aplicada a{' '}
            <span style={{ color: ACCENT }}>decisões reais</span>
          </h2>
        </div>

        {/* Feature cards */}
        <div className="m3-feats-grid" style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
        }}>
          {FEATURES.map(f => (
            <div key={f.n} className="m3-feat" style={{
              border: '1px solid rgba(238,238,245,.07)',
              borderRadius: 14,
              padding: '28px 24px',
              background: 'rgba(238,238,245,.02)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Subtle corner glow */}
              <div style={{
                position: 'absolute', top: -30, right: -30,
                width: 100, height: 100, borderRadius: '50%',
                background: `${f.glow}10`,
                pointerEvents: 'none',
              }}/>

              <div style={{
                fontFamily: MONO, fontWeight: 700, fontSize: 10,
                color: f.color, letterSpacing: '.08em', marginBottom: 16,
                opacity: .65,
              }}>{f.n}</div>

              <h3 style={{
                fontFamily: SYNE, fontWeight: 700, fontSize: 16,
                letterSpacing: '-.015em', marginBottom: 12,
                color: '#eeeef5',
              }}>{f.title}</h3>

              <p style={{
                fontSize: 13, color: 'rgba(238,238,245,.38)', lineHeight: 1.65,
              }}>{f.body}</p>

              {/* Accent bottom line */}
              <div style={{
                position: 'absolute', bottom: 0, left: 0,
                height: 2, width: '35%',
                background: `linear-gradient(90deg, ${f.color}70, transparent)`,
                borderRadius: 99,
              }}/>
            </div>
          ))}
        </div>
      </section>

      {/* ── SAMPLE DATA ── */}
      <section ref={sampleRef} className="m3-section" style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px 96px',
      }}>
        <div style={{
          border: `1px solid rgba(238,238,245,.08)`,
          borderRadius: 16,
          background: 'rgba(238,238,245,.018)',
          overflow: 'hidden',
        }}>
          {/* Header row */}
          <div style={{
            padding: '28px 36px 24px',
            borderBottom: '1px solid rgba(238,238,245,.06)',
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
          }}>
            <div>
              <p style={{
                fontSize: 10, color: 'rgba(238,238,245,.3)',
                letterSpacing: '.09em', fontWeight: 600,
                fontFamily: MONO, textTransform: 'uppercase', marginBottom: 8,
              }}>dataset de exemplo</p>
              <p style={{
                fontFamily: SYNE, fontWeight: 700, fontSize: 18,
                letterSpacing: '-.015em', color: '#eeeef5', marginBottom: 6,
              }}>
                Não tem dados agora? Use o nosso.
              </p>
              <p style={{
                fontSize: 13, color: 'rgba(238,238,245,.35)', lineHeight: 1.6, maxWidth: 500,
              }}>
                Dataset sintético pronto para testar o M3-Mix do início ao fim — sem precisar preparar nada.
              </p>
            </div>
            <a
              href="/exemplo-mmm.xlsx"
              download
              className="m3-dl-btn"
              style={{
                flexShrink: 0, alignSelf: 'center',
                background: 'rgba(238,238,245,.05)',
                color: '#eeeef5',
                border: '1px solid rgba(238,238,245,.1)',
                borderRadius: 8, padding: '11px 24px',
                fontFamily: SYNE, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', letterSpacing: '-.01em',
                textDecoration: 'none', display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
            >
              Baixar .xlsx ↓
            </a>
          </div>

          {/* Detail grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 1,
          }}>
            {[
              {
                label: '131 semanas',
                desc: 'Série temporal de ~2,5 anos — volume suficiente para o modelo Bayesiano estimar adstock e saturação com confiança.',
              },
              {
                label: 'TV · Search · Social',
                desc: 'Um canal de geração de demanda (TV), um de captura (Search) e um híbrido (Social) — cobre os principais padrões de ROAS e saturação.',
              },
              {
                label: 'Promoção · Sazonalidade',
                desc: 'Colunas de controle incluídas: promo_flag (semanas com desconto) e holiday_flag (feriados). O modelo as isola do efeito da mídia.',
              },
            ].map(({ label, desc }, i) => (
              <div key={label} style={{
                padding: '20px 24px',
                borderRight: i < 2 ? '1px solid rgba(238,238,245,.05)' : 'none',
              }}>
                <div style={{
                  fontFamily: MONO, fontWeight: 700, fontSize: 11,
                  color: 'rgba(238,238,245,.55)', marginBottom: 8,
                  letterSpacing: '.03em',
                }}>{label}</div>
                <div style={{
                  fontSize: 12, color: 'rgba(238,238,245,.28)', lineHeight: 1.65,
                }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section className="m3-section" style={{
        position: 'relative', zIndex: 10,
        maxWidth: 1160, margin: '0 auto',
        padding: '0 48px 96px',
      }}>
        <div style={{
          border: `1px solid ${ACCENT}20`,
          borderRadius: 16,
          padding: '52px 56px',
          background: `linear-gradient(135deg, ${ACCENT}09 0%, transparent 55%)`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 32,
          flexWrap: 'wrap',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Background glow */}
          <div style={{
            position: 'absolute', top: -60, left: -60,
            width: 200, height: 200, borderRadius: '50%',
            background: `${ACCENT}08`,
            pointerEvents: 'none',
          }}/>

          <div>
            <p style={{
              fontFamily: SYNE, fontWeight: 800,
              fontSize: 'clamp(20px, 2.5vw, 30px)',
              letterSpacing: '-.025em', marginBottom: 8,
            }}>
              Pronto para medir o que funciona?
            </p>
            <p style={{ fontSize: 13, color: 'rgba(238,238,245,.35)' }}>
              Suba seu CSV e tenha resultados em minutos — sem configuração.
            </p>
          </div>

          <button
            className="m3-cta"
            onClick={scrollToUpload}
            style={{
              flexShrink: 0,
              background: ACCENT, color: BG, border: 'none',
              borderRadius: 8, padding: '13px 32px',
              fontFamily: SYNE, fontWeight: 700, fontSize: 14,
              cursor: 'pointer', letterSpacing: '-.01em',
              boxShadow: `0 0 32px ${ACCENT}28`,
              whiteSpace: 'nowrap',
            }}
          >
            Começar análise →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position: 'relative', zIndex: 10,
        borderTop: '1px solid rgba(238,238,245,.05)',
        padding: '20px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: SYNE, fontWeight: 800, fontSize: 14, opacity: .3 }}>M3-Mix</span>
        <span style={{ fontSize: 11, color: 'rgba(238,238,245,.18)', letterSpacing: '.04em', fontFamily: MONO }}>
          Modelo Bayesiano · IA Generativa · Open Source
        </span>
      </footer>

    </div>
  )
}
