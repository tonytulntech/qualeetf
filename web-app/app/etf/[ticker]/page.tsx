'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Info, ArrowUpRight, Clock, AlertTriangle } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { byTicker, getSuggestedAlternatives } from '@/lib/etf-catalog'
import Composizione from '@/app/components/Composizione'

type PriceRow = { date: string; close: number; is_synthetic: boolean }

const RANGES = [
  { label: 'YTD', months: 0 },
  { label: '1A',  months: 12 },
  { label: '3A',  months: 36 },
  { label: '5A',  months: 60 },
  { label: '10A', months: 120 },
  { label: 'Max', months: 999 },
]

function pct(from: number, to: number) {
  return ((to - from) / from) * 100
}

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals).replace('.', ',')
}

function CustomTooltip({ active, payload, label, isPct }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  const val = d.value
  const formatted = isPct
    ? `${val >= 0 ? '+' : ''}${fmt(val)}%`
    : `${d.payload.is_synthetic ? '~' : ''}${fmt(val)}`
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 140 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '1rem', fontWeight: 700, color: d.payload.is_synthetic ? 'var(--text-2)' : 'var(--accent)' }}>
        {formatted}
      </div>
      {d.payload.is_synthetic && (
        <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginTop: 3 }}>dato sintetico</div>
      )}
    </div>
  )
}

export default function ETFPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [range, setRange] = useState('Max')
  const [logScale, setLogScale] = useState(false)
  const [mode, setMode] = useState<'price' | 'pct'>('price')
  const [loading, setLoading] = useState(true)

  const decoded = ticker ? decodeURIComponent(ticker) : ''
  const etf = decoded ? byTicker[decoded] ?? null : null

  useEffect(() => {
    if (!decoded) return
    fetch(`/api/prices/${encodeURIComponent(decoded)}`)
      .then(r => r.json())
      .then(({ real = [], synthetic = [] }) => {
        const all: PriceRow[] = [...synthetic, ...real].sort((a, b) =>
          a.date < b.date ? -1 : 1
        )
        setPrices(all)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [decoded])

  const rangeData = useMemo(() => {
    if (!prices.length) return []
    const r = RANGES.find(r => r.label === range)!
    if (r.months === 999) return prices
    const cutoff = new Date()
    if (r.label === 'YTD') {
      cutoff.setMonth(0); cutoff.setDate(1)
    } else {
      cutoff.setMonth(cutoff.getMonth() - r.months)
    }
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return prices.filter(p => p.date >= cutoffStr)
  }, [prices, range])

  // Decima i dati per il grafico: max 600 punti indipendentemente dal range
  const displayData = useMemo(() => {
    if (!rangeData.length) return []
    const MAX_POINTS = 600
    const step = Math.max(1, Math.floor(rangeData.length / MAX_POINTS))
    const decimated: PriceRow[] = []
    for (let i = 0; i < rangeData.length; i += step) decimated.push(rangeData[i])
    // Assicura sempre l'ultimo punto (prezzo corrente)
    if (decimated[decimated.length - 1] !== rangeData[rangeData.length - 1]) {
      decimated.push(rangeData[rangeData.length - 1])
    }
    const basePrice = decimated[0]?.close ?? 1
    return decimated.map(p => ({
      ...p,
      dateLabel: new Date(p.date).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }),
      value: mode === 'pct' ? ((p.close - basePrice) / basePrice) * 100 : p.close,
    }))
  }, [rangeData, mode])

  const tickInterval = Math.max(1, Math.floor(displayData.length / (range === 'YTD' || range === '1A' ? 6 : 8)))

  const firstPrice = rangeData[0]?.close
  const lastPrice = rangeData[rangeData.length - 1]?.close
  const change = firstPrice && lastPrice ? pct(firstPrice, lastPrice) : null
  const isUp = change !== null && change >= 0

  const realPrices = prices.filter(p => p.is_synthetic !== true)
  const syntheticCount = prices.filter(p => p.is_synthetic === true).length

  const allTimeFirst = realPrices[0]?.close
  const allTimeLast = realPrices[realPrices.length - 1]?.close
  const allTimeChange = allTimeFirst && allTimeLast ? pct(allTimeFirst, allTimeLast) : null

  // "Troppo recente" se meno di 3 anni di dati reali
  const yearsOfRealData = realPrices.length > 0
    ? (Date.now() - new Date(realPrices[0].date).getTime()) / (365.25 * 24 * 3600 * 1000)
    : 0
  const isTooNew = yearsOfRealData > 0 && yearsOfRealData < 3
  const alternatives = etf && isTooNew ? getSuggestedAlternatives(etf, 3) : []

  if (loading) return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--surface-2)', borderRadius: 8, marginBottom: 32 }} />
      <div style={{ height: 400, background: 'var(--surface-2)', borderRadius: 20 }} />
    </div>
  )

  if (!etf) return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-2)', marginTop: 80 }}>ETF non trovato.</div>
      <Link href="/screener" className="btn btn-ghost" style={{ marginTop: 20 }}>← Torna allo screener</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 920, margin: '0 auto', padding: '40px 24px' }}>

      {/* Back */}
      <Link href="/screener" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, marginBottom: 28 }}>
        <ArrowLeft size={15} /> Screener
      </Link>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={24} color="var(--accent)" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6 }}>
              {etf.name}
            </h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="badge badge-muted">{etf.ticker}</span>
              {etf.isin && <span className="badge badge-muted" style={{ fontFamily: 'monospace', letterSpacing: '0.03em' }}>{etf.isin}</span>}
              <span className="badge badge-blue">{etf.type}</span>
              {etf.provider && <span className="badge badge-muted">{etf.provider}</span>}
              <span className="badge badge-muted">{etf.exchange}</span>
            </div>
          </div>
        </div>

        {lastPrice && (
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 }}>
              {fmt(lastPrice)}
            </div>
            {change !== null && (
              <div style={{ marginTop: 6 }}>
                <span className={`badge ${isUp ? 'badge-up' : 'badge-down'}`} style={{ fontSize: '0.8rem' }}>
                  {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                  {isUp ? '+' : ''}{fmt(change)}% ({range})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'TER annuale', value: etf.ter != null ? `${etf.ter}%` : '—' },
          { label: 'Exchange', value: etf.exchange || '—' },
          { label: 'Dati reali dal', value: realPrices[0]?.date ? new Date(realPrices[0].date).getFullYear().toString() : '—' },
          { label: 'Rendimento totale', value: allTimeChange != null ? `${allTimeChange > 0 ? '+' : ''}${fmt(allTimeChange)}%` : '—', color: allTimeChange !== null ? (allTimeChange >= 0 ? 'var(--green)' : 'var(--red)') : undefined },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 18px' }}>
            <div className="label" style={{ marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.02em', color: s.color || 'var(--text-1)' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Banner ETF troppo recente */}
      {isTooNew && (
        <div className="card" style={{ padding: '20px 24px', marginBottom: 24, borderLeft: '3px solid var(--yellow, #F5C46C)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: alternatives.length > 0 ? 20 : 0 }}>
            <Clock size={20} color="var(--yellow, #F5C46C)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Storia troppo breve per un backtest significativo
              </div>
              <div style={{ fontSize: '0.8375rem', color: 'var(--text-2)', lineHeight: 1.5 }}>
                Questo ETF esiste da&nbsp;
                <strong>{yearsOfRealData < 1 ? 'meno di 1 anno' : `${yearsOfRealData.toFixed(1).replace('.', ',')} anni`}</strong>
                {realPrices[0]?.date && (
                  <> (lanciato il {new Date(realPrices[0].date).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })})</>
                )}. Per simulazioni affidabili servono almeno 10–15 anni di dati.
              </div>
            </div>
          </div>

          {alternatives.length > 0 && (
            <>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>
                ETF simili con storia più lunga
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {alternatives.map(alt => (
                  <Link
                    key={alt.ticker}
                    href={`/etf/${encodeURIComponent(alt.ticker)}`}
                    style={{ textDecoration: 'none', flex: '1 1 200px', minWidth: 180 }}
                  >
                    <div style={{
                      background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px',
                      border: '1px solid var(--border)', cursor: 'pointer',
                      transition: 'border-color 0.15s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{alt.ticker}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>TER {alt.ter}%</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--text-1)' }}>
                        {alt.name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>
                        {alt.underlyingIndex}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <Link
                  href={`/backtest?ticker=${alternatives[0]?.ticker}`}
                  className="btn btn-ghost"
                  style={{ fontSize: '0.8rem', gap: 6 }}
                >
                  Fai backtest su {alternatives[0]?.ticker} <ArrowUpRight size={13} />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="card" style={{ padding: '24px 20px', marginBottom: 24 }}>
        {/* Top row: title + range tabs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Storico prezzi</div>
            {syntheticCount > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={11} /> Tratteggio = dati sintetici (proxy indice)
              </div>
            )}
          </div>
          <div className="tab-group">
            {RANGES.map(r => (
              <button key={r.label} className={`tab ${range === r.label ? 'active' : ''}`}
                onClick={() => setRange(r.label)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Second row: mode + log toggles */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tab-group">
            <button className={`tab ${mode === 'price' ? 'active' : ''}`} onClick={() => setMode('price')} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Prezzo</button>
            <button className={`tab ${mode === 'pct' ? 'active' : ''}`} onClick={() => setMode('pct')} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>%</button>
          </div>
          <button
            className={`tab ${logScale ? 'active' : ''}`}
            onClick={() => setLogScale(v => !v)}
            style={{ padding: '5px 12px', fontSize: '0.75rem' }}
          >
            Log
          </button>
        </div>

        {displayData.length === 0 ? (
          <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-3)' }}>
            <AlertTriangle size={28} strokeWidth={1.5} />
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nessun dato disponibile per questo ETF</div>
            <div style={{ fontSize: '0.775rem', textAlign: 'center', maxWidth: 320, lineHeight: 1.5 }}>
              I prezzi non sono ancora nel database. Prova un ETF simile dallo screener.
            </div>
          </div>
        ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart key={range} data={displayData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={Math.max(tickInterval, 1)} />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--text-3)' }}
              tickLine={false} axisLine={false}
              scale={logScale && mode === 'price' ? 'log' : 'auto'}
              domain={logScale && mode === 'price' ? ['auto', 'auto'] : undefined}
              tickFormatter={v => mode === 'pct' ? `${v > 0 ? '+' : ''}${v.toFixed(0)}%` : v.toFixed(0)}
            />
            <Tooltip content={<CustomTooltip isPct={mode === 'pct'} />} />
            <Area
              type="monotone" dataKey="value"
              stroke="var(--accent)" strokeWidth={2}
              fill="url(#colorReal)"
              dot={false} activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Composizione */}
      <Composizione ticker={decoded} />

      {/* Info card */}
      <div className="card" style={{ padding: '20px 24px', marginBottom: 24 }}>
        <div className="label" style={{ marginBottom: 16 }}>Informazioni</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px' }}>
          {[
            { label: 'ISIN', value: etf.isin || '—' },
            { label: 'Tipo', value: etf.type || '—' },
            { label: 'Provider', value: etf.provider || '—' },
            { label: 'Exchange', value: etf.exchange || '—' },
            { label: 'Indice sottostante', value: etf.underlyingIndex || '—' },
            { label: 'TER', value: etf.ter != null ? `${etf.ter}% annuo` : '—' },
            { label: 'Dati disponibili dal', value: prices[0]?.date ? new Date(prices[0].date).toLocaleDateString('it-IT') : '—' },
            { label: 'Dati reali dal', value: realPrices[0]?.date ? new Date(realPrices[0].date).toLocaleDateString('it-IT') : '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{row.label}</span>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA backtest */}
      <div className="card" style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Vuoi fare un backtest su {etf.ticker}?</div>
          <div style={{ fontSize: '0.8375rem', color: 'var(--text-2)' }}>Simula un PAC mensile e vedi CAGR, drawdown e rendimento totale.</div>
        </div>
        <Link href={`/backtest?ticker=${etf.ticker}`} className="btn btn-primary" style={{ gap: 6 }}>
          Apri nel backtest <ArrowUpRight size={15} />
        </Link>
      </div>

    </div>
  )
}
