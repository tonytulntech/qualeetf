'use client'
import Link from 'next/link'
import { ArrowRight, TrendingUp, BarChart2, Shield, Zap, Globe, ChevronRight, ArrowUpRight } from 'lucide-react'

const STATS = [
  { value: '31+', label: 'ETF europei' },
  { value: '30+', label: 'anni di storia' },
  { value: '€0', label: 'per iniziare' },
  { value: '100%', label: 'dati reali' },
]

const FEATURES = [
  { icon: <BarChart2 size={20} />, title: 'Backtest professionale', desc: 'Simula PAC su 30 anni di storia. CAGR, Sharpe, max drawdown.' },
  { icon: <Globe size={20} />, title: 'Schede ETF complete', desc: 'Holdings, settori, paesi, valute, dividendi per ogni ETF.' },
  { icon: <TrendingUp size={20} />, title: 'Screener avanzato', desc: 'Filtra per provider, TER, asset class, rendimento storico.' },
  { icon: <Shield size={20} />, title: 'Dati affidabili', desc: 'Aggiornamento mensile. Storia sintetica dal 1993.' },
  { icon: <Zap size={20} />, title: 'Calcoli istantanei', desc: 'Engine ottimizzato. Nessun lag, nessun crash.' },
  { icon: <ChevronRight size={20} />, title: 'Confronto portafogli', desc: 'Metti a confronto fino a 3 strategie sullo stesso grafico.' },
]

const POPULAR_ETF = [
  { ticker: 'SWDA.MI', name: 'iShares Core MSCI World', type: 'Azionario Globale', ter: 0.20, perf: '+8.4%', up: true },
  { ticker: 'VWCE.DE', name: 'Vanguard FTSE All-World', type: 'Azionario Globale', ter: 0.22, perf: '+7.9%', up: true },
  { ticker: 'EQQQ.MI', name: 'Invesco NASDAQ-100', type: 'Tech USA', ter: 0.30, perf: '+11.2%', up: true },
  { ticker: 'AGGH.MI', name: 'iShares Global Aggregate Bond', type: 'Obbligazionario', ter: 0.10, perf: '-1.1%', up: false },
  { ticker: 'V80A.DE', name: 'Vanguard LifeStrategy 80%', type: 'Bilanciato', ter: 0.25, perf: '+6.3%', up: true },
]

export default function Home() {
  return (
    <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 24px' }}>

      {/* Hero */}
      <section style={{ paddingTop: 'clamp(72px, 12vw, 128px)', paddingBottom: 80, textAlign: 'center' }}>

        <h1 style={{
          fontSize: 'clamp(2.6rem, 6vw, 5rem)',
          fontWeight: 700,
          letterSpacing: '-0.04em',
          lineHeight: 1.1,
          marginBottom: 22,
        }}>
          Che<span style={{ color: 'var(--accent)' }}>ETF</span> Scegliere?<br />
          <span style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)', color: 'var(--text-2)', fontWeight: 600 }}>Non te lo diciamo.</span><br />
          <span style={{ fontSize: 'clamp(1.6rem, 4vw, 3rem)' }}>Te li confrontiamo tutti.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.175rem)',
          color: 'var(--text-2)',
          maxWidth: 480, margin: '0 auto 40px',
          lineHeight: 1.65, fontWeight: 400,
        }}>
          E tu scegli in autonomia — con <strong style={{ color: 'var(--text-1)', fontWeight: 600 }}>30 anni</strong> di storia reale.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/screener" className="btn btn-primary" style={{ padding: '13px 28px', fontSize: '0.9375rem', borderRadius: 14 }}>
            Esplora gli ETF <ArrowRight size={16} />
          </Link>
          <Link href="/backtest" className="btn btn-ghost" style={{ padding: '13px 28px', fontSize: '0.9375rem', borderRadius: 14 }}>
            Prova il backtest
          </Link>
        </div>

        {/* Mini dashboard preview card */}
        <div style={{ marginTop: 72, position: 'relative', maxWidth: 720, marginLeft: 'auto', marginRight: 'auto' }}>
          <div className="card" style={{ padding: 24, textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Gradient balance card */}
              <div className="gradient-card" style={{ padding: '24px 20px', minHeight: 160 }}>
                <div style={{ position: 'relative', zIndex: 1 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                    Valore portafoglio
                  </div>
                  <div style={{ fontSize: '2.25rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1.1 }}>
                    €32,568<span style={{ fontSize: '1.25rem', fontWeight: 400 }}>.00</span>
                  </div>
                  <div style={{ marginTop: 24, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                    Mese scorso <strong style={{ color: '#fff' }}>€28,940.00</strong>
                    <span className="badge badge-up" style={{ marginLeft: 8, fontSize: '0.7rem' }}>▲ 4.14%</span>
                  </div>
                </div>
              </div>

              {/* Stats mini */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="card-sm" style={{ padding: '16px 18px', flex: 1 }}>
                  <div className="label" style={{ marginBottom: 8 }}>CAGR (10 anni)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--accent)' }}>
                    +11.4%
                  </div>
                </div>
                <div className="card-sm" style={{ padding: '16px 18px', flex: 1 }}>
                  <div className="label" style={{ marginBottom: 8 }}>Max Drawdown</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--red)' }}>
                    -32.1%
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Glow */}
          <div style={{ position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)', width: 400, height: 80, background: 'var(--accent)', filter: 'blur(60px)', opacity: 0.1, pointerEvents: 'none' }} />
        </div>
      </section>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 80 }}>
        {STATS.map(s => (
          <div key={s.label} className="card" style={{ padding: '22px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--accent)', marginBottom: 4 }}>
              {s.value}
            </div>
            <div className="label">{s.label}</div>
          </div>
        ))}
      </section>

      {/* ETF Table */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em' }}>ETF più popolari</h2>
          <Link href="/screener" style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--accent)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
            Vedi tutti <ArrowRight size={13} />
          </Link>
        </div>

        <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
          {POPULAR_ETF.map((etf, i) => (
            <Link key={etf.ticker} href={`/etf/${etf.ticker}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr auto',
                alignItems: 'center', padding: '16px 20px',
                borderBottom: i < POPULAR_ETF.length - 1 ? '1px solid var(--border)' : 'none',
                transition: 'background var(--transition)', cursor: 'pointer',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: 'var(--accent-dim)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={17} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9125rem', marginBottom: 3 }}>{etf.name}</div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-muted" style={{ fontSize: '0.7rem' }}>{etf.ticker}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>{etf.type}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>TER {etf.ter}%</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`badge ${etf.up ? 'badge-up' : 'badge-down'}`}>{etf.perf}</span>
                  <ArrowUpRight size={14} color="var(--text-3)" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Features */}
      <section style={{ marginBottom: 80 }}>
        <div style={{ marginBottom: 32 }}>
          <div className="label" style={{ marginBottom: 8 }}>Funzionalità</div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em' }}>
            Tutto per investire con metodo
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {FEATURES.map(f => (
            <div key={f.title} className="card" style={{ padding: '24px 20px' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                background: 'var(--accent-dim)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--accent)', marginBottom: 14,
              }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 600, marginBottom: 6, fontSize: '0.9125rem' }}>{f.title}</div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ marginBottom: 80 }}>
        <div className="card" style={{ padding: 'clamp(36px, 5vw, 56px)', maxWidth: 580, margin: '0 auto', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 200, height: 200, background: 'var(--accent)', filter: 'blur(80px)', opacity: 0.08, pointerEvents: 'none' }} />
          <div className="badge badge-blue" style={{ marginBottom: 18, display: 'inline-flex' }}>Gratis per sempre</div>
          <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 12 }}>
            Inizia ad analizzare oggi
          </h2>
          <p style={{ color: 'var(--text-2)', marginBottom: 28, lineHeight: 1.65, fontSize: '0.9375rem' }}>
            Nessuna carta di credito. Accesso immediato a tutti gli ETF europei e al backtest.
          </p>
          <Link href="/screener" className="btn btn-primary" style={{ padding: '13px 32px', fontSize: '0.9375rem', borderRadius: 14 }}>
            Esplora gli ETF <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em' }}>
          Che<span style={{ color: 'var(--accent)' }}>ETF</span>
        </span>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-3)' }}>
          Dati aggiornati mensilmente · Non è consulenza finanziaria · © 2026 CheETF
        </span>
      </footer>
    </div>
  )
}
