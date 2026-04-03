'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { UploadZone } from '@/components/upload/UploadZone'
import { CsvPreview } from '@/components/upload/CsvPreview'
import { uploadCsv } from '@/lib/api'

const ACCENT = '#e4ff1a'
const BG     = '#07070f'
const SYNE   = 'var(--font-syne), sans-serif'

const FEATURES = [
  {
    n: '01',
    title: 'Modelo Bayesiano',
    body: 'PyMC-Marketing com adstock geométrico e saturação logística. Estimativas com incerteza real — não atribuição de last-click.',
    color: ACCENT,
  },
  {
    n: '02',
    title: 'Narrativa com IA',
    body: 'LLaMA 3.3 70B via Groq lê seus resultados e escreve um relatório executivo com pontos de atenção e recomendações acionáveis.',
    color: '#60a5fa',
  },
  {
    n: '03',
    title: 'Otimização de Budget',
    body: 'Simule realocações de verba com um slider e veja o impacto projetado na receita. Descubra onde cada real rende mais.',
    color: '#34d399',
  },
]

export default function HomePage() {
  const router   = useRouter()
  const uploadRef = useRef<HTMLDivElement>(null)
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
      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.3} }
        @keyframes fadeUp {
          from{opacity:0;transform:translateY(20px)}
          to{opacity:1;transform:translateY(0)}
        }
        @keyframes scanline {
          0%{transform:translateY(0)}
          100%{transform:translateY(200px)}
        }
        @keyframes borderPulse {
          0%,100%{opacity:.4} 50%{opacity:.9}
        }
        .a1{animation:fadeUp .6s .05s both}
        .a2{animation:fadeUp .6s .15s both}
        .a3{animation:fadeUp .6s .25s both}
        .a4{animation:fadeUp .6s .38s both}
        .feat:hover{background:rgba(238,238,245,.045)!important;border-color:rgba(238,238,245,.12)!important}
        .upload-ring{transition:border-color .25s,box-shadow .25s}
        .upload-ring.drag,
        .upload-ring:focus-within{
          border-color:${ACCENT}80!important;
          box-shadow:0 0 0 4px ${ACCENT}14,inset 0 0 40px ${ACCENT}06!important;
        }
        .cta-btn:hover{
          box-shadow:0 0 48px ${ACCENT}55!important;
          transform:translateY(-1px);
        }
        .cta-btn{transition:box-shadow .2s,transform .15s}
      `}</style>

      {/* Dot grid + top glow */}
      <div style={{
        position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
        backgroundImage:'radial-gradient(circle,rgba(238,238,245,.05) 1px,transparent 1px)',
        backgroundSize:'28px 28px',
      }}/>
      <div style={{
        position:'fixed',inset:0,zIndex:0,pointerEvents:'none',
        background:`radial-gradient(ellipse 60% 35% at 50% 0%,${ACCENT}12 0%,transparent 70%)`,
      }}/>

      {/* ── NAV ── */}
      <nav style={{
        position:'relative',zIndex:10,
        display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'18px 48px',
        borderBottom:'1px solid rgba(238,238,245,.06)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:9}}>
          <div style={{
            width:26,height:26,borderRadius:6,
            border:`1.5px solid ${ACCENT}45`,background:`${ACCENT}0e`,
            display:'flex',alignItems:'center',justifyContent:'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="0.5" y="7" width="3" height="5.5" rx=".5" fill={ACCENT} opacity=".9"/>
              <rect x="5" y="4" width="3" height="8.5" rx=".5" fill={ACCENT} opacity=".65"/>
              <rect x="9.5" y="1" width="3" height="11.5" rx=".5" fill={ACCENT} opacity=".4"/>
            </svg>
          </div>
          <span style={{fontFamily:SYNE,fontWeight:800,fontSize:16,letterSpacing:'-.02em'}}>M3-Mix</span>
        </div>
        <div style={{display:'flex',gap:20,fontSize:11,color:'rgba(238,238,245,.35)',letterSpacing:'.05em'}}>
          {(['PyMC','Groq','Supabase'] as const).map((t,i)=>(
            <span key={t} style={{display:'flex',alignItems:'center',gap:5}}>
              <span style={{
                width:5,height:5,borderRadius:'50%',display:'inline-block',
                background:[ACCENT,'#60a5fa','#34d399'][i],
              }}/>
              {t}
            </span>
          ))}
        </div>
      </nav>

      {/* ── HERO: headline centrado, compacto ── */}
      <section style={{
        position:'relative',zIndex:10,
        textAlign:'center',
        padding:'72px 24px 56px',
        maxWidth:760,margin:'0 auto',
      }}>
        {/* Badge */}
        <div className="a1" style={{
          display:'inline-flex',alignItems:'center',gap:7,
          border:'1px solid rgba(238,238,245,.08)',
          borderRadius:99,padding:'5px 14px 5px 9px',
          marginBottom:28,background:'rgba(238,238,245,.03)',
        }}>
          <span style={{width:5,height:5,borderRadius:'50%',background:ACCENT,animation:'pulse 2s ease infinite'}}/>
          <span style={{fontSize:10,color:'rgba(238,238,245,.45)',letterSpacing:'.08em',fontWeight:600}}>
            MARKETING MIX MODELING COM IA
          </span>
        </div>

        {/* H1 — 2 linhas, direto ao ponto */}
        <h1 className="a2" style={{
          fontFamily:SYNE,fontWeight:800,
          fontSize:'clamp(36px,5.5vw,62px)',
          lineHeight:1.05,letterSpacing:'-.03em',
          marginBottom:20,
        }}>
          Pare de achar.<br/>
          <span style={{color:ACCENT,textShadow:`0 0 48px ${ACCENT}55`}}>Comece a medir.</span>
        </h1>

        {/* Subtitle — uma linha */}
        <p className="a3" style={{
          fontSize:16,color:'rgba(238,238,245,.42)',
          lineHeight:1.6,marginBottom:40,
          maxWidth:480,margin:'0 auto 40px',
        }}>
          Suba seu CSV de mídia. Um modelo Bayesiano entrega ROAS real,
          adstock e saturação por canal — com relatório executivo em segundos.
        </p>

        {/* CTA scroll */}
        <button className="a4 cta-btn" onClick={scrollToUpload} style={{
          background:ACCENT,color:BG,border:'none',
          borderRadius:8,padding:'11px 26px',
          fontFamily:SYNE,fontWeight:700,fontSize:14,
          cursor:'pointer',letterSpacing:'-.01em',
          boxShadow:`0 0 32px ${ACCENT}35`,
        }}>
          Começar análise →
        </button>
      </section>

      {/* ── UPLOAD ZONE — protagonista ── */}
      <section ref={uploadRef} style={{
        position:'relative',zIndex:10,
        maxWidth:640,margin:'0 auto',
        padding:'0 24px 80px',
      }}>
        <div
          className={`upload-ring${dragging?' drag':''}`}
          style={{
            border:`1.5px solid rgba(238,238,245,.1)`,
            borderRadius:16,
            background:'rgba(238,238,245,.025)',
            overflow:'hidden',
          }}
        >
          {/* Terminal header bar */}
          <div style={{
            borderBottom:'1px solid rgba(238,238,245,.06)',
            padding:'10px 18px',
            display:'flex',alignItems:'center',gap:10,
          }}>
            <div style={{display:'flex',gap:5}}>
              {['#ff5f57','#ffbd2e','#28c840'].map(c=>(
                <div key={c} style={{width:9,height:9,borderRadius:'50%',background:c,opacity:.6}}/>
              ))}
            </div>
            <span style={{
              fontSize:10,color:'rgba(238,238,245,.3)',
              letterSpacing:'.06em',fontWeight:500,
            }}>
              {file ? file.name.toUpperCase() : 'CARREGAR DADOS'}
            </span>
          </div>

          {/* Upload content */}
          <div style={{padding:28}}
            onDragEnter={()=>setDragging(true)}
            onDragLeave={()=>setDragging(false)}
            onDrop={()=>setDragging(false)}
          >
            {!file ? (
              <UploadZone onFile={handleFile}/>
            ):(
              <div style={{display:'flex',flexDirection:'column',gap:14}}>
                <CsvPreview headers={headers} onAnalyze={handleAnalyze} loading={loading}/>
                <button onClick={()=>{setFile(null);setHeaders([])}} style={{
                  background:'none',border:'none',cursor:'pointer',
                  fontSize:11,color:'rgba(238,238,245,.3)',
                  textDecoration:'underline',textAlign:'left',
                }}>
                  trocar arquivo
                </button>
              </div>
            )}
            {error&&<p style={{color:'#f87171',fontSize:12,marginTop:10}}>{error}</p>}
          </div>

          {/* Column hints footer */}
          {!file&&(
            <div style={{
              borderTop:'1px solid rgba(238,238,245,.05)',
              padding:'9px 18px',
              display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',
            }}>
              <span style={{fontSize:10,color:'rgba(238,238,245,.2)',marginRight:4}}>colunas:</span>
              {['date','revenue','*_spend'].map(col=>(
                <code key={col} style={{
                  fontSize:10,color:'rgba(238,238,245,.4)',
                  background:'rgba(238,238,245,.05)',
                  border:'1px solid rgba(238,238,245,.07)',
                  borderRadius:4,padding:'2px 7px',
                }}>
                  {col}
                </code>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── METRICS STRIP ── */}
      <section style={{
        position:'relative',zIndex:10,
        maxWidth:760,margin:'0 auto',
        padding:'0 24px 96px',
        display:'grid',gridTemplateColumns:'repeat(3,1fr)',
        gap:1,
        borderTop:'1px solid rgba(238,238,245,.06)',
      }}>
        {[
          {label:'ROAS',detail:'retorno por canal sobre o spend real'},
          {label:'Adstock',detail:'efeito residual de mídia modelado'},
          {label:'Saturação',detail:'curva de retorno marginal por canal'},
        ].map((m,i)=>(
          <div key={m.label} style={{
            padding:'28px 24px',
            borderRight:i<2?'1px solid rgba(238,238,245,.06)':'none',
            textAlign:'center',
          }}>
            <div style={{
              fontFamily:SYNE,fontWeight:800,fontSize:20,
              color:ACCENT,marginBottom:6,letterSpacing:'-.01em',
            }}>{m.label}</div>
            <div style={{fontSize:11,color:'rgba(238,238,245,.3)',lineHeight:1.5}}>{m.detail}</div>
          </div>
        ))}
      </section>

      {/* ── FEATURES ── */}
      <section style={{
        position:'relative',zIndex:10,
        maxWidth:1100,margin:'0 auto',
        padding:'0 32px 96px',
      }}>
        <div style={{textAlign:'center',marginBottom:48}}>
          <p style={{fontSize:10,color:'rgba(238,238,245,.3)',letterSpacing:'.1em',fontWeight:600,textTransform:'uppercase',marginBottom:10}}>
            o que o modelo entrega
          </p>
          <h2 style={{
            fontFamily:SYNE,fontWeight:800,
            fontSize:'clamp(24px,3vw,36px)',
            letterSpacing:'-.025em',
          }}>
            Ciência de dados aplicada a{' '}
            <span style={{color:ACCENT}}>decisões reais</span>
          </h2>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14}}>
          {FEATURES.map(f=>(
            <div key={f.n} className="feat" style={{
              borderLeft:`3px solid ${f.color}`,
              borderTop:'1px solid rgba(238,238,245,.07)',
              borderRight:'1px solid rgba(238,238,245,.07)',
              borderBottom:'1px solid rgba(238,238,245,.07)',
              borderRadius:12,padding:'24px 22px 24px 20px',
              background:'rgba(238,238,245,.025)',
              transition:'background .2s,border-color .2s',
            }}>
              <div style={{
                fontFamily:SYNE,fontWeight:700,fontSize:10,
                color:f.color,letterSpacing:'.08em',marginBottom:12,opacity:.7,
              }}>{f.n}</div>
              <h3 style={{
                fontFamily:SYNE,fontWeight:700,fontSize:15,
                letterSpacing:'-.01em',marginBottom:10,
              }}>{f.title}</h3>
              <p style={{fontSize:13,color:'rgba(238,238,245,.38)',lineHeight:1.65}}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER CTA ── */}
      <section style={{
        position:'relative',zIndex:10,
        maxWidth:1100,margin:'0 auto',
        padding:'0 32px 96px',
      }}>
        <div style={{
          border:`1px solid ${ACCENT}22`,borderRadius:16,
          padding:'44px 48px',
          background:`linear-gradient(135deg,${ACCENT}09 0%,transparent 55%)`,
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:32,
          flexWrap:'wrap',
        }}>
          <div>
            <p style={{
              fontFamily:SYNE,fontWeight:800,
              fontSize:'clamp(20px,2.5vw,30px)',
              letterSpacing:'-.025em',marginBottom:6,
            }}>
              Pronto para medir o que funciona?
            </p>
            <p style={{fontSize:13,color:'rgba(238,238,245,.35)'}}>
              Suba seu CSV e tenha resultados em minutos — sem configuração.
            </p>
          </div>
          <button className="cta-btn" onClick={scrollToUpload} style={{
            flexShrink:0,background:ACCENT,color:BG,border:'none',
            borderRadius:8,padding:'12px 28px',
            fontFamily:SYNE,fontWeight:700,fontSize:14,cursor:'pointer',
            letterSpacing:'-.01em',boxShadow:`0 0 32px ${ACCENT}30`,whiteSpace:'nowrap',
          }}>
            Começar análise →
          </button>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        position:'relative',zIndex:10,
        borderTop:'1px solid rgba(238,238,245,.05)',
        padding:'18px 48px',
        display:'flex',alignItems:'center',justifyContent:'space-between',
      }}>
        <span style={{fontFamily:SYNE,fontWeight:700,fontSize:13,opacity:.35}}>M3-Mix</span>
        <span style={{fontSize:11,color:'rgba(238,238,245,.18)',letterSpacing:'.04em'}}>
          Modelo Bayesiano · IA Generativa · Open Source
        </span>
      </footer>

      {/* Responsive */}
      <style>{`
        @media(max-width:700px){
          nav{padding:14px 20px!important}
          section{padding-left:16px!important;padding-right:16px!important}
          div[style*="grid-template-columns: repeat(3"]{grid-template-columns:1fr!important}
          div[style*="repeat(3,1fr)"]{grid-template-columns:1fr!important}
        }
      `}</style>
    </div>
  )
}
