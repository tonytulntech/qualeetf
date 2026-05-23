'use client'
import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Info, ArrowUpRight, Clock, AlertTriangle, BarChart2 } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { ETF_CATALOG, byTicker, getSuggestedAlternatives, type ETFEntry } from '@/lib/etf-catalog'
import { getEtfDescription } from '@/lib/etf-descriptions'
import Composizione from '@/app/components/Composizione'

// ─── Types ───────────────────────────────────────────────────────────────────

type PriceRow = { date: string; close: number; is_synthetic: boolean }

// ─── Constants ───────────────────────────────────────────────────────────────

const RANGES = [
  { label: 'YTD', months: 0 },
  { label: '1A',  months: 12 },
  { label: '3A',  months: 36 },
  { label: '5A',  months: 60 },
  { label: '10A', months: 120 },
  { label: 'Max', months: 999 },
]

const STAT_WINDOWS = ['1A', '3A', '5A', '10A', 'Max']
const RF = 2.5
const MSCI_WORLD_TICKER = 'SWDA.MI' // iShares Core MSCI World — benchmark for correlation

// ─── Stat computation helpers ─────────────────────────────────────────────────

function genMonths(startYM: string, endYM?: string): string[] {
  const end = endYM ?? new Date().toISOString().slice(0, 7)
  const res: string[] = []
  let [y, mo] = startYM.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  while (y < ey || (y === ey && mo <= em)) {
    res.push(`${y}-${String(mo).padStart(2, '0')}`)
    mo++; if (mo > 12) { mo = 1; y++ }
  }
  return res
}

function toMonthlyMap(prices: PriceRow[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const p of prices) map[p.date.slice(0, 7)] = p.close
  const all = genMonths('1985-01')
  const filled: Record<string, number> = {}
  let last = 0
  for (const m of all) {
    if (map[m] != null) last = map[m]
    if (last > 0) filled[m] = last
  }
  return filled
}

type ETFStats = {
  cagr: number; vol: number; sharpe: number; sortino: number
  maxDrawdown: number; calmar: number; ulcer: number; upi: number
  posMonths: number; months: number; totalReturn: number
}

function computeStats(monthlyMap: Record<string, number>, months: string[]): ETFStats | null {
  if (months.length < 3) return null
  const prices = months.map(m => monthlyMap[m]).filter(p => p > 0)
  if (prices.length < 3) return null
  const mReturns: number[] = []
  for (let i = 1; i < prices.length; i++) mReturns.push(prices[i] / prices[i - 1] - 1)
  const cagr = (mReturns.reduce((p, r) => p * (1 + r), 1) ** (12 / mReturns.length) - 1) * 100
  const totalReturn = (prices[prices.length - 1] / prices[0] - 1) * 100
  const avg = mReturns.reduce((a, b) => a + b, 0) / mReturns.length
  const vol = Math.sqrt(mReturns.reduce((a, r) => a + (r - avg) ** 2, 0) / mReturns.length * 12) * 100
  const sharpe = vol > 0 ? (cagr - RF) / vol : 0
  const negSq = mReturns.reduce((a, r) => a + Math.min(r, 0) ** 2, 0)
  const downDev = Math.sqrt(negSq / mReturns.length * 12) * 100
  const sortino = downDev > 0 ? (cagr - RF) / downDev : 0
  let peak = prices[0], maxDD = 0, sumDDSq = 0
  for (const p of prices) {
    if (p > peak) peak = p
    const dd = (p - peak) / peak * 100
    if (dd < maxDD) maxDD = dd
    sumDDSq += dd * dd
  }
  const calmar = maxDD < 0 ? cagr / Math.abs(maxDD) : 0
  const ulcer = Math.sqrt(sumDDSq / prices.length)
  const upi = ulcer > 0 ? (cagr - RF) / ulcer : 0
  const posMonths = (mReturns.filter(r => r > 0).length / mReturns.length) * 100
  return { cagr, totalReturn, vol, sharpe, sortino, maxDrawdown: maxDD, calmar, ulcer, upi, posMonths, months: months.length }
}

function pearson(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length)
  if (n < 6) return NaN
  const ax = a.slice(0, n), bx = b.slice(0, n)
  const ma = ax.reduce((s, v) => s + v, 0) / n
  const mb = bx.reduce((s, v) => s + v, 0) / n
  let cov = 0, sa = 0, sb = 0
  for (let i = 0; i < n; i++) {
    cov += (ax[i] - ma) * (bx[i] - mb)
    sa  += (ax[i] - ma) ** 2
    sb  += (bx[i] - mb) ** 2
  }
  const denom = Math.sqrt(sa * sb)
  return denom > 0 ? Math.max(-1, Math.min(1, cov / denom)) : 0
}

function corrLabel(r: number): { label: string; color: string; bg: string; desc: string } {
  if (isNaN(r)) return { label: '—',       color: 'var(--text-3)',  bg: 'var(--surface-2)', desc: 'dati insufficienti' }
  if (r < 0)    return { label: `${r.toFixed(2)}`, color: '#60a5fa', bg: '#60a5fa18', desc: 'correlazione negativa' }
  if (r < 0.3)  return { label: `${r.toFixed(2)}`, color: '#22c55e', bg: '#22c55e18', desc: 'bassa — ottima diversificazione' }
  if (r < 0.6)  return { label: `${r.toFixed(2)}`, color: '#f59e0b', bg: '#f59e0b18', desc: 'media — diversificazione parziale' }
  return           { label: `${r.toFixed(2)}`, color: '#ef4444', bg: '#ef444418', desc: 'alta — comportamento simile al benchmark' }
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function fmt(n: number, decimals = 2) {
  return n.toFixed(decimals).replace('.', ',')
}
function pct(from: number, to: number) {
  return ((to - from) / from) * 100
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

// ─── Similar ETF card ──────────────────────────────────────────────────────────

function SimilarCard({ etf, router }: { etf: ETFEntry; router: ReturnType<typeof useRouter> }) {
  return (
    <div
      onClick={() => router.push(`/etf/${encodeURIComponent(etf.ticker)}`)}
      className="card"
      style={{ padding: '16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span className="badge badge-muted" style={{ fontSize: '0.72rem', fontWeight: 700 }}>{etf.ticker}</span>
        {etf.ter != null && <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>TER {etf.ter}%</span>}
      </div>
      <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.35, color: 'var(--text-1)', marginBottom: 6 }}>
        {etf.name}
      </div>
      <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {etf.underlyingIndex || etf.subCategory}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={e => { e.stopPropagation(); router.push(`/backtest?ticker=${etf.ticker}`) }}
          style={{ flex: 1, padding: '5px 0', fontSize: '0.7rem', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          Backtest
        </button>
        <button
          onClick={e => { e.stopPropagation(); router.push(`/comparator?tickers=${encodeURIComponent(etf.ticker)}`) }}
          style={{ flex: 1, padding: '5px 0', fontSize: '0.7rem', fontWeight: 600, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-dim)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface-2)')}
        >
          Confronta
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ETFPage() {
  const { ticker } = useParams<{ ticker: string }>()
  const router = useRouter()
  const [prices, setPrices] = useState<PriceRow[]>([])
  const [benchPrices, setBenchPrices] = useState<PriceRow[]>([])
  const [range, setRange] = useState('Max')
  const [logScale, setLogScale] = useState(false)
  const [mode, setMode] = useState<'price' | 'pct'>('price')
  const [statsWindow, setStatsWindow] = useState('Max')
  const [loading, setLoading] = useState(true)

  const decoded = ticker ? decodeURIComponent(ticker) : ''
  const etf = decoded ? byTicker[decoded] ?? null : null
  const isBenchmark = decoded === MSCI_WORLD_TICKER

  useEffect(() => {
    if (!decoded) return
    // Fetch main ETF prices + benchmark in parallel
    Promise.all([
      fetch(`/api/prices/${encodeURIComponent(decoded)}`).then(r => r.json()),
      isBenchmark
        ? Promise.resolve({ real: [], synthetic: [] })
        : fetch(`/api/prices/${encodeURIComponent(MSCI_WORLD_TICKER)}`).then(r => r.json()),
    ]).then(([main, bench]) => {
      const allMain: PriceRow[] = [...(main.synthetic ?? []), ...(main.real ?? [])].sort((a, b) => a.date < b.date ? -1 : 1)
      const allBench: PriceRow[] = [...(bench.synthetic ?? []), ...(bench.real ?? [])].sort((a, b) => a.date < b.date ? -1 : 1)
      setPrices(allMain)
      setBenchPrices(allBench)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [decoded, isBenchmark])

  // ── Chart data ──────────────────────────────────────────────────────────────
  const rangeData = useMemo(() => {
    if (!prices.length) return []
    const r = RANGES.find(r => r.label === range)!
    if (r.months === 999) return prices
    const cutoff = new Date()
    if (r.label === 'YTD') { cutoff.setMonth(0); cutoff.setDate(1) }
    else cutoff.setMonth(cutoff.getMonth() - r.months)
    const cutoffStr = cutoff.toISOString().slice(0, 10)
    return prices.filter(p => p.date >= cutoffStr)
  }, [prices, range])

  const displayData = useMemo(() => {
    if (!rangeData.length) return []
    const MAX_POINTS = 600
    const step = Math.max(1, Math.floor(rangeData.length / MAX_POINTS))
    const decimated: PriceRow[] = []
    for (let i = 0; i < rangeData.length; i += step) decimated.push(rangeData[i])
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

  // ── Performance stats ────────────────────────────────────────────────────────
  const perfStats = useMemo((): ETFStats | null => {
    if (!prices.length) return null
    const monthlyMap = toMonthlyMap(prices)
    const allMonths = Object.keys(monthlyMap).sort()
    if (!allMonths.length) return null
    const latest = allMonths[allMonths.length - 1]
    const [ly, lm] = latest.split('-').map(Number)

    let windowMonths: string[]
    if (statsWindow === 'Max') {
      windowMonths = allMonths
    } else {
      const numMonths = { '1A': 12, '3A': 36, '5A': 60, '10A': 120 }[statsWindow] ?? 60
      let sy = ly, sm = lm - numMonths
      while (sm <= 0) { sm += 12; sy-- }
      const startYM = `${sy}-${String(sm).padStart(2, '0')}`
      windowMonths = allMonths.filter(m => m >= startYM)
    }
    return computeStats(monthlyMap, windowMonths)
  }, [prices, statsWindow])

  // ── Correlation with MSCI World ───────────────────────────────────────────────
  const corrValue = useMemo((): number => {
    if (isBenchmark || !prices.length || !benchPrices.length) return NaN
    const mapA = toMonthlyMap(prices)
    const mapB = toMonthlyMap(benchPrices)
    const common = Object.keys(mapA).filter(m => mapB[m] != null).sort()
    if (common.length < 6) return NaN
    const retA: number[] = [], retB: number[] = []
    for (let i = 1; i < common.length; i++) {
      retA.push(mapA[common[i]] / mapA[common[i - 1]] - 1)
      retB.push(mapB[common[i]] / mapB[common[i - 1]] - 1)
    }
    return pearson(retA, retB)
  }, [prices, benchPrices, isBenchmark])

  // ── Similar ETFs ─────────────────────────────────────────────────────────────
  const similarEtfs = useMemo((): ETFEntry[] => {
    if (!etf) return []
    const sameSubCat = ETF_CATALOG.filter(e =>
      e.ticker !== etf.ticker && e.subCategory === etf.subCategory
    )
    const sameCat = ETF_CATALOG.filter(e =>
      e.ticker !== etf.ticker && e.category === etf.category && e.subCategory !== etf.subCategory
    )
    return [...sameSubCat, ...sameCat].slice(0, 6)
  }, [etf])

  // ── Derived price values ──────────────────────────────────────────────────────
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

  const yearsOfRealData = realPrices.length > 0
    ? (Date.now() - new Date(realPrices[0].date).getTime()) / (365.25 * 24 * 3600 * 1000)
    : 0
  const isTooNew = yearsOfRealData > 0 && yearsOfRealData < 3
  const alternatives = etf && isTooNew ? getSuggestedAlternatives(etf, 3) : []

  const corrInfo = corrLabel(corrValue)

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ height: 28, width: 200, background: 'var(--surface-2)', borderRadius: 8, marginBottom: 32 }} />
      <div style={{ height: 400, background: 'var(--surface-2)', borderRadius: 20 }} />
    </div>
  )

  if (!etf) return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', textAlign: 'center' }}>
      <div style={{ color: 'var(--text-2)', marginTop: 80 }}>ETF non trovato.</div>
      <Link href="/screener" className="btn btn-ghost" style={{ marginTop: 20 }}>← Torna allo screener</Link>
    </div>
  )

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

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

      {/* ── Plain-Italian description ──────────────────────────────────── */}
      <div style={{
        padding: '18px 22px', marginBottom: 24, borderRadius: 14,
        background: 'var(--accent-dim)',
        border: '1px solid var(--accent)',
        display: 'flex', gap: 14, alignItems: 'flex-start',
      }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0, marginTop: 1 }}>💡</span>
        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-1)', lineHeight: 1.7 }}>
          {getEtfDescription(etf)}
        </p>
      </div>

      {/* Quick stats row */}
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
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Storia troppo breve per un backtest significativo</div>
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
                  <Link key={alt.ticker} href={`/etf/${encodeURIComponent(alt.ticker)}`} style={{ textDecoration: 'none', flex: '1 1 200px', minWidth: 180 }}>
                    <div style={{ background: 'var(--surface-2)', borderRadius: 12, padding: '14px 16px', border: '1px solid var(--border)', cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.72rem' }}>{alt.ticker}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>TER {alt.ter}%</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600, lineHeight: 1.3, color: 'var(--text-1)' }}>{alt.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4 }}>{alt.underlyingIndex}</div>
                    </div>
                  </Link>
                ))}
              </div>
              <div style={{ marginTop: 14 }}>
                <Link href={`/backtest?ticker=${alternatives[0]?.ticker}`} className="btn btn-ghost" style={{ fontSize: '0.8rem', gap: 6 }}>
                  Fai backtest su {alternatives[0]?.ticker} <ArrowUpRight size={13} />
                </Link>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chart */}
      <div className="card" style={{ padding: '24px 20px', marginBottom: 24 }}>
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
              <button key={r.label} className={`tab ${range === r.label ? 'active' : ''}`} onClick={() => setRange(r.label)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <div className="tab-group">
            <button className={`tab ${mode === 'price' ? 'active' : ''}`} onClick={() => setMode('price')} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Prezzo</button>
            <button className={`tab ${mode === 'pct' ? 'active' : ''}`} onClick={() => setMode('pct')} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>%</button>
          </div>
          <button className={`tab ${logScale ? 'active' : ''}`} onClick={() => setLogScale(v => !v)} style={{ padding: '5px 12px', fontSize: '0.75rem' }}>Log</button>
        </div>

        {displayData.length === 0 ? (
          <div style={{ height: 280, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text-3)' }}>
            <AlertTriangle size={28} strokeWidth={1.5} />
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>Nessun dato disponibile per questo ETF</div>
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
                tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false}
                scale={logScale && mode === 'price' ? 'log' : 'auto'}
                domain={logScale && mode === 'price' ? ['auto', 'auto'] : undefined}
                tickFormatter={v => mode === 'pct' ? `${v > 0 ? '+' : ''}${v.toFixed(0)}%` : v.toFixed(0)}
              />
              <Tooltip content={<CustomTooltip isPct={mode === 'pct'} />} />
              <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2} fill="url(#colorReal)" dot={false} activeDot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ── Performance stats ─────────────────────────────────────────────────── */}
      <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <BarChart2 size={15} color="var(--accent)" />
              <div className="label">Statistiche di Performance</div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Metriche annualizzate calcolate sui prezzi storici</div>
          </div>
          <div className="tab-group">
            {STAT_WINDOWS.map(w => (
              <button key={w} className={`tab${statsWindow === w ? ' active' : ''}`} onClick={() => setStatsWindow(w)}
                style={{ padding: '5px 12px', fontSize: '0.75rem' }}>
                {w}
              </button>
            ))}
          </div>
        </div>

        {!perfStats ? (
          <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-3)', fontSize: '0.875rem' }}>
            Dati insufficienti per il periodo selezionato
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              {
                label: 'CAGR (TWRR)',
                value: `${perfStats.cagr >= 0 ? '+' : ''}${fmt(perfStats.cagr)}%`,
                color: perfStats.cagr >= 0 ? 'var(--green)' : 'var(--red)',
                hint: 'Rendimento annuo composto',
              },
              {
                label: 'Volatilità',
                value: `${fmt(perfStats.vol)}%`,
                color: perfStats.vol > 20 ? 'var(--red)' : perfStats.vol > 12 ? 'var(--yellow, #f59e0b)' : 'var(--green)',
                hint: 'Deviazione standard annualizzata',
              },
              {
                label: 'Max Drawdown',
                value: `${fmt(perfStats.maxDrawdown)}%`,
                color: perfStats.maxDrawdown < -30 ? 'var(--red)' : perfStats.maxDrawdown < -15 ? 'var(--yellow, #f59e0b)' : 'var(--text-1)',
                hint: 'Perdita massima dal picco',
              },
              {
                label: 'Sharpe Ratio',
                value: fmt(perfStats.sharpe),
                color: perfStats.sharpe >= 1 ? 'var(--green)' : perfStats.sharpe >= 0.5 ? 'var(--text-1)' : 'var(--red)',
                hint: `Rendimento extra / volatilità (rf = ${RF}%)`,
              },
              {
                label: 'Sortino Ratio',
                value: fmt(perfStats.sortino),
                color: perfStats.sortino >= 1 ? 'var(--green)' : perfStats.sortino >= 0.5 ? 'var(--text-1)' : 'var(--red)',
                hint: 'Come Sharpe ma pesa solo volatilità negativa',
              },
              {
                label: 'Calmar Ratio',
                value: fmt(perfStats.calmar),
                color: perfStats.calmar >= 0.5 ? 'var(--green)' : 'var(--text-1)',
                hint: 'CAGR diviso per il Max Drawdown assoluto',
              },
              {
                label: 'Ulcer Index',
                value: `${fmt(perfStats.ulcer)}%`,
                color: perfStats.ulcer > 15 ? 'var(--red)' : perfStats.ulcer > 8 ? 'var(--yellow, #f59e0b)' : 'var(--green)',
                hint: 'Misura la profondità e durata dei drawdown',
              },
              {
                label: 'UPI (Ulcer Perf.)',
                value: fmt(perfStats.upi),
                color: perfStats.upi >= 0.5 ? 'var(--green)' : 'var(--text-1)',
                hint: 'Come Sharpe ma usa Ulcer Index al posto della volatilità',
              },
              {
                label: '% Mesi Positivi',
                value: `${fmt(perfStats.posMonths, 1)}%`,
                color: perfStats.posMonths >= 60 ? 'var(--green)' : 'var(--text-1)',
                hint: `Su ${Math.round(perfStats.months)} mesi (${(perfStats.months / 12).toFixed(1).replace('.', ',')} anni)`,
              },
            ].map(s => (
              <div key={s.label} style={{ padding: '16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.03em', color: s.color, marginBottom: 4 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', lineHeight: 1.4 }}>
                  {s.hint}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Correlazione con MSCI World ───────────────────────────────────────── */}
      {!isBenchmark && (
        <div className="card" style={{ padding: '24px', marginBottom: 24 }}>
          <div className="label" style={{ marginBottom: 4 }}>Correlazione con MSCI World (iShares SWDA)</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginBottom: 20 }}>
            Correlazione di Pearson sui rendimenti mensili — indica quanto l&apos;ETF si muove insieme al mercato azionario globale
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {/* Big correlation badge */}
            <div style={{
              minWidth: 120, padding: '20px 24px', borderRadius: 14,
              background: corrInfo.bg,
              border: `1px solid ${corrInfo.color}40`,
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '2.4rem', fontWeight: 700, letterSpacing: '-0.04em', color: corrInfo.color, lineHeight: 1 }}>
                {corrInfo.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: corrInfo.color, marginTop: 6, fontWeight: 600 }}>
                correlazione
              </div>
            </div>

            {/* Interpretation */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ fontWeight: 600, fontSize: '0.95rem', color: corrInfo.color, marginBottom: 6 }}>
                {isNaN(corrValue) ? 'Dati insufficienti' : corrInfo.desc.charAt(0).toUpperCase() + corrInfo.desc.slice(1)}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', lineHeight: 1.6 }}>
                {isNaN(corrValue)
                  ? 'Non ci sono abbastanza mesi in comune con il benchmark per calcolare la correlazione.'
                  : corrValue < 0.3
                  ? `Questo ETF si muove in modo abbastanza indipendente dal mercato azionario globale. Aggiungendolo a un portafoglio diversificato si può ridurre la volatilità complessiva.`
                  : corrValue < 0.6
                  ? `Questo ETF ha una correlazione moderata con il mercato globale. Offre una diversificazione parziale rispetto a un ETF MSCI World.`
                  : `Questo ETF è fortemente correlato con il mercato azionario globale. In portafoglio si comporterà in modo molto simile a un ETF MSCI World.`
                }
              </div>
            </div>

            {/* Color scale reference */}
            <div style={{ minWidth: 160 }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Scala
              </div>
              {[
                { range: '< 0.3', label: 'Bassa', color: '#22c55e' },
                { range: '0.3–0.6', label: 'Media', color: '#f59e0b' },
                { range: '> 0.6', label: 'Alta', color: '#ef4444' },
              ].map(item => (
                <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-2)' }}>
                    <strong>{item.range}</strong> — {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Composizione */}
      <Composizione ticker={decoded} />

      {/* ── ETF Simili ────────────────────────────────────────────────────────── */}
      {similarEtfs.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <div className="label" style={{ marginBottom: 4 }}>ETF Simili</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
              ETF della stessa categoria — {etf.subCategory}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {similarEtfs.map(e => (
              <SimilarCard key={e.ticker} etf={e} router={router} />
            ))}
          </div>
        </div>
      )}

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
