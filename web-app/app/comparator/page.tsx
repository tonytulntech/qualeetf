'use client'
import { Suspense, useState, useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, X, Plus } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { ETF_CATALOG, searchCatalog, type ETFEntry } from '@/lib/etf-catalog'

// ─── Historical events ────────────────────────────────────────────────────────

type HistEvent = { ym: string; label: string; type: 'crash' | 'recovery' | 'policy' | 'event' }
const HISTORICAL_EVENTS: HistEvent[] = [
  { ym: '1979-01', label: 'Volcker Shock – Stretta Fed',      type: 'policy'   },
  { ym: '1980-01', label: 'Recessione USA anni \'80',          type: 'crash'    },
  { ym: '1982-08', label: 'Ripresa Reaganiana',                type: 'recovery' },
  { ym: '1987-10', label: 'Black Monday',                      type: 'crash'    },
  { ym: '1990-08', label: 'Recessione 1990–91',                type: 'crash'    },
  { ym: '1991-04', label: 'Ripresa post-Guerra del Golfo',     type: 'recovery' },
  { ym: '1994-02', label: '"Bond Massacre" – rialzo Fed',      type: 'policy'   },
  { ym: '1995-01', label: 'Inizio Bull Market Tech',           type: 'recovery' },
  { ym: '1997-07', label: 'Crisi Asiatica',                    type: 'crash'    },
  { ym: '1998-08', label: 'Crisi Russa / LTCM',               type: 'crash'    },
  { ym: '2000-03', label: 'Scoppio Bolla Dot-com',             type: 'crash'    },
  { ym: '2003-03', label: 'Ripresa Post-Dotcom',               type: 'recovery' },
  { ym: '2007-10', label: 'Inizio Crisi 2008',                 type: 'crash'    },
  { ym: '2009-03', label: 'Inizio Bull Market post-Crisi',    type: 'recovery' },
  { ym: '2010-05', label: 'Crisi del Debito Europeo',         type: 'crash'    },
  { ym: '2012-07', label: '"Whatever it takes" – Draghi',     type: 'policy'   },
  { ym: '2015-08', label: 'Crisi Mercati Cinesi',              type: 'crash'    },
  { ym: '2016-06', label: 'Brexit',                            type: 'event'    },
  { ym: '2018-01', label: 'Guerra Commerciale USA–Cina',       type: 'crash'    },
  { ym: '2020-02', label: 'COVID-19 Lockdown',                 type: 'crash'    },
  { ym: '2022-02', label: 'Invasione Ucraina',                 type: 'crash'    },
  { ym: '2023-01', label: 'Inizio Rally AI',                   type: 'recovery' },
  { ym: '2025-01', label: 'Dazi di Trump',                     type: 'crash'    },
]
const EVENT_COLORS: Record<HistEvent['type'], string> = {
  crash: '#ef4444', recovery: '#22c55e', policy: '#f59e0b', event: '#60a5fa',
}

// ─── Types ───────────────────────────────────────────────────────────────────

type PriceRow = { date: string; close: number }

type ETFSeries = {
  entry: ETFEntry
  prices: PriceRow[]
  color: string
}

type ETFStats = {
  cagr: number; vol: number; sharpe: number; sortino: number
  maxDrawdown: number; calmar: number; ulcer: number; upi: number
  posMonths: number; months: number; totalReturn: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const COLORS = ['#4ade80', '#60a5fa', '#f59e0b', '#f472b6', '#a78bfa', '#34d399']
const RF = 2.5
const MAX_SERIES = 6

const PERIODS: { label: string; months: number | null }[] = [
  { label: '1A',  months: 12  },
  { label: '3A',  months: 36  },
  { label: '5A',  months: 60  },
  { label: '10A', months: 120 },
  { label: 'MAX', months: null },
]

type StatColDef = {
  key: keyof ETFStats
  label: string
  fmt: (v: number) => string
  lowerIsBetter?: boolean
  redBelow?: number
}

const STAT_COLS: StatColDef[] = [
  { key: 'totalReturn',  label: 'Rendimento tot.',  fmt: v => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` },
  { key: 'cagr',         label: 'CAGR (TWRR)',      fmt: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'vol',          label: 'Volatilità',        fmt: v => `${v.toFixed(2)}%`,  lowerIsBetter: true },
  { key: 'maxDrawdown',  label: 'Max Drawdown',      fmt: v => `${v.toFixed(2)}%`,  redBelow: -20 },
  { key: 'sharpe',       label: 'Sharpe',            fmt: v => v.toFixed(2) },
  { key: 'sortino',      label: 'Sortino',           fmt: v => v.toFixed(2) },
  { key: 'calmar',       label: 'Calmar',            fmt: v => v.toFixed(2) },
  { key: 'ulcer',        label: 'Ulcer Index',       fmt: v => `${v.toFixed(2)}%`,  lowerIsBetter: true },
  { key: 'upi',          label: 'UPI',               fmt: v => v.toFixed(2) },
  { key: 'posMonths',    label: '% Mesi Positivi',   fmt: v => `${v.toFixed(1)}%` },
  { key: 'months',       label: 'Durata',            fmt: v => `${Math.round(v / 12)} anni` },
]

const ROLLING_METRICS: { key: keyof ETFStats; label: string; fmt: (v: number) => string }[] = [
  { key: 'cagr',    label: 'CAGR',       fmt: v => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` },
  { key: 'vol',     label: 'Volatilità', fmt: v => `${v.toFixed(2)}%` },
  { key: 'sharpe',  label: 'Sharpe',     fmt: v => v.toFixed(2) },
  { key: 'sortino', label: 'Sortino',    fmt: v => v.toFixed(2) },
  { key: 'calmar',  label: 'Calmar',     fmt: v => v.toFixed(2) },
  { key: 'ulcer',   label: 'Ulcer',      fmt: v => `${v.toFixed(2)}%` },
]
const ROLLING_WINDOWS = [
  { months: 12, label: '12M' },
  { months: 24, label: '24M' },
  { months: 36, label: '36M' },
  { months: 60, label: '60M' },
]

// ─── Utilities ────────────────────────────────────────────────────────────────

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

function corrColor(r: number): string {
  const abs = Math.abs(r)
  if (abs <= 0.5) {
    const t = abs / 0.5
    return `rgb(${Math.round(34 + (245-34)*t)},${Math.round(197 + (158-197)*t)},${Math.round(94 + (11-94)*t)})`
  }
  const t = (abs - 0.5) / 0.5
  return `rgb(${Math.round(245 + (239-245)*t)},${Math.round(158 + (68-158)*t)},${Math.round(11 + (68-11)*t)})`
}

// ─── Tooltips ─────────────────────────────────────────────────────────────────

function GrowthTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 160 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ fontSize: '0.8rem', fontWeight: 600, color: p.stroke, marginBottom: 2 }}>
          {p.name}: {p.value >= 100 ? '+' : ''}{(p.value - 100).toFixed(1)}%
        </div>
      ))}
    </div>
  )
}

function DDTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 150 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ fontSize: '0.8rem', fontWeight: 600, color: p.stroke, marginBottom: 2 }}>
          {p.name}: {p.value.toFixed(1)}%
        </div>
      ))}
    </div>
  )
}

function RollingTooltip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 160 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ fontSize: '0.8rem', fontWeight: 600, color: p.stroke, marginBottom: 2 }}>
          {p.name}: {fmt ? fmt(p.value) : p.value.toFixed(2)}
        </div>
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

function ComparatorContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [searchRes, setSearchRes] = useState<ETFEntry[]>([])
  const [series, setSeries] = useState<ETFSeries[]>([])
  const [loadingTicker, setLoadingTicker] = useState<string | null>(null)
  const [period, setPeriod] = useState<string>('5A')
  const [showSearch, setShowSearch] = useState(false)
  const [chartLog, setChartLog] = useState(false)
  const [showEvents, setShowEvents] = useState(false)
  const [rollingMetric, setRollingMetric] = useState<string>('cagr')
  const [rollingWindow, setRollingWindow] = useState<number>(36)

  // ── Price cache: avoids re-fetching already-loaded ETFs ───────────────────
  const priceCache = useRef<Record<string, PriceRow[]>>({})

  // ── URL is the single source of truth for which ETFs are selected ─────────
  //    Re-evaluates whenever the URL changes (handles screener → comparator navigation
  //    even when the component is already mounted, i.e. same route, different params)
  const urlTickers = useMemo(() => {
    const tp = searchParams.get('tickers') || searchParams.get('ticker') || ''
    if (!tp) return [] as string[]
    return tp.split(',').map(t => decodeURIComponent(t.trim())).filter(Boolean)
  }, [searchParams])

  // Load/reload series whenever URL tickers change
  useEffect(() => {
    if (urlTickers.length === 0) {
      setSeries([])
      return
    }

    let cancelled = false

    ;(async () => {
      const result: ETFSeries[] = []

      for (const t of urlTickers) {
        if (cancelled) return
        const entry = ETF_CATALOG.find(e => e.ticker === t)
        if (!entry) continue

        // Fetch only if not cached
        if (!priceCache.current[t]) {
          setLoadingTicker(t)
          try {
            const res = await fetch(`/api/prices/${encodeURIComponent(t)}`)
            const { real = [], synthetic = [] } = await res.json()
            priceCache.current[t] = [...synthetic, ...real].sort((a, b) => a.date < b.date ? -1 : 1)
          } catch {
            continue
          }
        }

        const color = COLORS[result.length % COLORS.length]
        result.push({ entry, prices: priceCache.current[t], color })
      }

      if (!cancelled) {
        setSeries(result)
        setLoadingTicker(null)
      }
    })()

    return () => { cancelled = true }
  }, [urlTickers.join(',')]) // eslint-disable-line

  useEffect(() => {
    if (!query.trim()) { setSearchRes([]); return }
    const t = setTimeout(() => setSearchRes(searchCatalog(query, 8)), 150)
    return () => clearTimeout(t)
  }, [query])

  // ── Add / remove ETFs (updates URL → triggers the load effect) ────────────
  function addETF(entry: ETFEntry) {
    if (urlTickers.includes(entry.ticker)) return
    if (urlTickers.length >= MAX_SERIES) return
    const newTickers = [...urlTickers, entry.ticker]
    window.history.replaceState(
      null, '',
      `${window.location.pathname}?tickers=${newTickers.map(encodeURIComponent).join(',')}`
    )
    // Manually dispatch a popstate-equivalent so useSearchParams re-evaluates.
    // Next.js 14+ listens to replaceState via patched history — no extra event needed.
    setQuery(''); setSearchRes([]); setShowSearch(false)
    // Force the useMemo to re-run by triggering a re-render
    // (Next.js patches history so useSearchParams reacts automatically)
  }

  function remove(ticker: string) {
    const newTickers = urlTickers.filter(t => t !== ticker)
    const newUrl = newTickers.length
      ? `${window.location.pathname}?tickers=${newTickers.map(encodeURIComponent).join(',')}`
      : window.location.pathname
    window.history.replaceState(null, '', newUrl)
  }

  // ── Core computation ──────────────────────────────────────────────────────
  const computedResult = useMemo(() => {
    if (!series.length) return { chartData: [], ddData: [], stats: [], windowMonths: [], maps: [] as Record<string, number>[] }

    const periodConfig = PERIODS.find(p => p.label === period)!
    const maps = series.map(s => toMonthlyMap(s.prices))

    const allAvailable = Object.keys(maps[0]).filter(m => maps.every(mp => mp[m] != null)).sort()
    if (!allAvailable.length) return { chartData: [], ddData: [], stats: [], windowMonths: [], maps }

    let windowMonths: string[]
    if (periodConfig.months) {
      const cutoff = allAvailable[allAvailable.length - 1]
      const [cy, cm] = cutoff.split('-').map(Number)
      let sy = cy, sm = cm - periodConfig.months
      while (sm <= 0) { sm += 12; sy-- }
      const startYM = `${sy}-${String(sm).padStart(2, '0')}`
      windowMonths = allAvailable.filter(m => m >= startYM)
    } else {
      windowMonths = allAvailable
    }

    if (windowMonths.length < 2) return { chartData: [], ddData: [], stats: [], windowMonths: [], maps }

    const baseMonth = windowMonths[0]
    const chartData = windowMonths.map(ym => {
      const [y, mo] = ym.split('-')
      const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
      const row: Record<string, any> = { ym, label }
      for (const s of series) {
        const idx = series.indexOf(s)
        const base = maps[idx][baseMonth]
        const cur  = maps[idx][ym]
        row[s.entry.ticker] = base > 0 && cur != null ? parseFloat(((cur / base) * 100).toFixed(2)) : null
      }
      return row
    })

    const peakPerSeries = series.map(() => -Infinity)
    const ddData = windowMonths.map((ym, i) => {
      const [y, mo] = ym.split('-')
      const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
      const row: Record<string, any> = { ym, label }
      for (const s of series) {
        const idx = series.indexOf(s)
        const val = chartData[i][s.entry.ticker] as number | null
        if (val != null) {
          if (val > peakPerSeries[idx]) peakPerSeries[idx] = val
          row[s.entry.ticker] = peakPerSeries[idx] > 0 ? parseFloat(((val - peakPerSeries[idx]) / peakPerSeries[idx] * 100).toFixed(2)) : 0
        }
      }
      return row
    })

    const stats = series.map(s => ({
      ticker: s.entry.ticker,
      color: s.color,
      stats: computeStats(maps[series.indexOf(s)], windowMonths),
    }))

    return { chartData, ddData, stats, windowMonths, maps }
  }, [series, period])

  const { chartData, ddData, stats, windowMonths, maps } = computedResult

  // ── Rolling returns ───────────────────────────────────────────────────────
  const rollingData = useMemo(() => {
    if (!series.length || windowMonths.length <= rollingWindow) return []
    const metricDef = ROLLING_METRICS.find(m => m.key === rollingMetric)!
    const result: Record<string, any>[] = []
    for (let i = rollingWindow; i <= windowMonths.length; i++) {
      const slice = windowMonths.slice(i - rollingWindow, i)
      const lastYM = slice[slice.length - 1]
      const [y, mo] = lastYM.split('-')
      const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
      const row: Record<string, any> = { label, ym: lastYM }
      for (let j = 0; j < series.length; j++) {
        const st = computeStats(maps[j], slice)
        if (st) row[series[j].entry.ticker] = parseFloat((st[metricDef.key] as number).toFixed(3))
      }
      result.push(row)
    }
    return result
  }, [series, windowMonths, maps, rollingWindow, rollingMetric])

  // ── Correlation matrix ────────────────────────────────────────────────────
  const corrMatrix = useMemo(() => {
    if (series.length < 2 || windowMonths.length < 6) return null
    return series.map((_, j) => {
      const prices = windowMonths.map(m => maps[j][m]).filter(p => p != null && p > 0)
      const ret: number[] = []
      for (let k = 1; k < prices.length; k++) ret.push(prices[k] / prices[k - 1] - 1)
      return ret
    })
  }, [series, windowMonths, maps])

  const interval = Math.max(Math.floor(chartData.length / 10), 1)
  const rollingInterval = Math.max(Math.floor(rollingData.length / 10), 1)

  const eventChartLabels = useMemo(() => {
    if (!chartData.length) return []
    return HISTORICAL_EVENTS.map(e => {
      const pt = (chartData as any[]).find(d => d.ym >= e.ym)
      return pt ? { ...e, chartLabel: pt.label as string } : null
    }).filter(Boolean) as (HistEvent & { chartLabel: string })[]
  }, [chartData])

  const bestFor = (col: StatColDef) => {
    const vals = stats.map(s => s.stats?.[col.key] ?? null).filter(v => v != null) as number[]
    if (!vals.length) return null
    return col.lowerIsBetter ? Math.min(...vals) : Math.max(...vals)
  }

  const rollingMetricDef = ROLLING_METRICS.find(m => m.key === rollingMetric)!

  // Loading spinner overlay for pills
  const isLoading = loadingTicker !== null

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 28px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ marginBottom: 8 }}>Strumento</div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Confronta ETF
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem' }}>
          Confronta fino a {MAX_SERIES} ETF: rendimento normalizzato, rolling returns, correlazione e statistiche affiancate.
        </p>
      </div>

      {/* Search + selected pills */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', minWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="input" style={{ paddingLeft: 36 }}
            placeholder={urlTickers.length >= MAX_SERIES ? `Massimo ${MAX_SERIES} ETF` : 'Cerca ETF per nome, ticker o ISIN…'}
            disabled={urlTickers.length >= MAX_SERIES || isLoading}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setShowSearch(true)}
            onBlur={() => setTimeout(() => setShowSearch(false), 150)}
          />
          {showSearch && searchRes.length > 0 && (
            <div className="card" style={{ position: 'absolute', left: 0, right: 0, zIndex: 50, marginTop: 6, padding: 0, overflow: 'hidden', minWidth: 360 }}>
              {searchRes.map(e => (
                <button key={e.ticker} onMouseDown={() => addETF(e)}
                  disabled={urlTickers.includes(e.ticker) || isLoading}
                  style={{ width: '100%', textAlign: 'left', padding: '11px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', opacity: urlTickers.includes(e.ticker) ? 0.4 : 1 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{e.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{e.ticker} · {e.category} · {e.subCategory}</div>
                  </div>
                  {loadingTicker === e.ticker
                    ? <div style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    : <Plus size={14} style={{ color: 'var(--text-3)' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pills — built from series (stable once loaded) */}
        {series.map(s => (
          <div key={s.entry.ticker} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px 6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.entry.ticker}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.entry.name}</span>
            <button onClick={() => remove(s.entry.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', padding: 2 }}>
              <X size={12} />
            </button>
          </div>
        ))}

        {/* Loading spinner for ETF being fetched */}
        {loadingTicker && !series.find(s => s.entry.ticker === loadingTicker) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 10, opacity: 0.6 }}>
            <div style={{ width: 10, height: 10, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{loadingTicker}</span>
          </div>
        )}
      </div>

      {series.length === 0 && !isLoading && (
        <div className="card" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-3)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>📈</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>Nessun ETF selezionato</div>
          <div style={{ fontSize: '0.875rem' }}>Cerca e aggiungi almeno due ETF per confrontarli</div>
        </div>
      )}

      {series.length > 0 && chartData.length > 0 && (
        <>
          {/* Period selector + toggles */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
            <div className="tab-group">
              {PERIODS.map(p => (
                <button key={p.label} className={`tab${period === p.label ? ' active' : ''}`} onClick={() => setPeriod(p.label)}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className={`tab${chartLog ? ' active' : ''}`} onClick={() => setChartLog(v => !v)} style={{ fontSize: '0.75rem', padding: '5px 11px' }}>Log</button>
              <button className={`tab${showEvents ? ' active' : ''}`} onClick={() => setShowEvents(v => !v)} style={{ fontSize: '0.75rem', padding: '5px 11px' }}>📅 Eventi</button>
            </div>
          </div>

          {/* Growth chart */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 4 }}>Rendimento normalizzato</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Base 100 all&apos;inizio del periodo</div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart key={`growth-${chartLog}`} data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={interval} />
                <YAxis scale={chartLog ? 'log' : 'auto'} domain={chartLog ? ['auto', 'auto'] : undefined}
                  tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={60}
                  tickFormatter={v => `${v >= 100 ? '+' : ''}${(v - 100).toFixed(0)}%`} />
                <ReferenceLine y={100} stroke="var(--border)" strokeWidth={1.5} />
                <Tooltip content={<GrowthTooltip />} />
                {showEvents && eventChartLabels.map(e => (
                  <ReferenceLine key={e.ym} x={e.chartLabel} stroke={EVENT_COLORS[e.type]} strokeWidth={1.5} strokeOpacity={0.75} strokeDasharray="3 2" />
                ))}
                {series.map(s => (
                  <Line key={s.entry.ticker} type="monotone" dataKey={s.entry.ticker} name={s.entry.ticker} stroke={s.color} strokeWidth={2.5} dot={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {showEvents && eventChartLabels.length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legenda eventi</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {eventChartLabels.map(e => (
                    <div key={e.ym} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 6, background: `${EVENT_COLORS[e.type]}18`, border: `1px solid ${EVENT_COLORS[e.type]}50`, fontSize: '0.7rem' }}>
                      <span style={{ color: EVENT_COLORS[e.type], fontWeight: 700, fontSize: '0.68rem', flexShrink: 0 }}>{e.ym.slice(0, 4)}</span>
                      <span style={{ color: 'var(--text-2)' }}>{e.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawdown chart */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 4 }}>Drawdown</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Perdita dal massimo precedente</div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ddData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={interval} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={52} tickFormatter={v => `${v}%`} />
                <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                <Tooltip content={<DDTooltip />} />
                {series.map(s => (
                  <Line key={s.entry.ticker} type="monotone" dataKey={s.entry.ticker} name={s.entry.ticker} stroke={s.color} strokeWidth={1.5} dot={false} connectNulls={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Rolling returns */}
          <div className="card" style={{ padding: '24px', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div className="label" style={{ marginBottom: 4 }}>Rolling Returns</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Metrica annualizzata su finestre scorrevoli</div>
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div className="tab-group">
                  {ROLLING_METRICS.map(m => (
                    <button key={m.key} className={`tab${rollingMetric === m.key ? ' active' : ''}`} onClick={() => setRollingMetric(m.key)} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{m.label}</button>
                  ))}
                </div>
                <div className="tab-group">
                  {ROLLING_WINDOWS.map(w => (
                    <button key={w.months} className={`tab${rollingWindow === w.months ? ' active' : ''}`} onClick={() => setRollingWindow(w.months)} style={{ fontSize: '0.72rem', padding: '4px 10px' }}>{w.label}</button>
                  ))}
                </div>
              </div>
            </div>
            {rollingData.length < 3 ? (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                Dati insufficienti per la finestra {rollingWindow}M nel periodo selezionato
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={rollingData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={rollingInterval} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} width={60} tickFormatter={v => rollingMetricDef.fmt(v)} />
                  <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1} />
                  <Tooltip content={<RollingTooltip fmt={rollingMetricDef.fmt} />} />
                  {series.map(s => (
                    <Line key={s.entry.ticker} type="monotone" dataKey={s.entry.ticker} name={s.entry.ticker} stroke={s.color} strokeWidth={2} dot={false} connectNulls={false} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Stats table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)' }}>
              <div className="label">Statistiche a confronto</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>▲ = migliore nel periodo · {period}</div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--surface-2)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 20px', fontSize: '0.7rem', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-2)', width: 180 }}>Metrica</th>
                    {stats.map(s => (
                      <th key={s.ticker} style={{ textAlign: 'right', padding: '10px 20px', fontSize: '0.8rem', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color }} />
                          {s.ticker}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {STAT_COLS.map((col, ri) => {
                    const best = bestFor(col)
                    return (
                      <tr key={col.key} style={{ borderTop: '1px solid var(--border)', background: ri % 2 === 0 ? 'transparent' : 'var(--surface-2)' }}>
                        <td style={{ padding: '11px 20px', fontSize: '0.82rem', color: 'var(--text-2)', fontWeight: 500 }}>{col.label}</td>
                        {stats.map(({ ticker, color, stats: st }) => {
                          const val = st?.[col.key] ?? null
                          const isBest = val != null && best != null && Math.abs(val - best) < 0.0001
                          const allVals = stats.map(s => s.stats?.[col.key] ?? null).filter(v => v != null) as number[]
                          const hasTie = isBest && allVals.filter(v => Math.abs(v - best!) < 0.0001).length > 1
                          const isRed = col.redBelow != null && val != null && val < col.redBelow
                          return (
                            <td key={ticker} style={{ textAlign: 'right', padding: '11px 20px', fontSize: '0.86rem', fontWeight: isBest ? 700 : 400, color: isBest ? color : isRed ? 'var(--red)' : 'var(--text-1)', whiteSpace: 'nowrap' }}>
                              {isBest && !hasTie && <span style={{ marginRight: 4, fontSize: '0.68rem', color }}>▲</span>}
                              {val != null ? col.fmt(val) : '—'}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Correlation matrix ──────────────────────────────────────────── */}
          {series.length >= 2 && corrMatrix && (
            <div className="card" style={{ padding: '28px 24px' }}>
              <div style={{ marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 4 }}>Matrice di Correlazione</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                  Correlazione di Pearson sui rendimenti mensili — verde = bassa correlazione (diversificazione efficace), rosso = alta
                </div>
              </div>

              {/* Legend bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>0 (bassa)</span>
                <div style={{ flex: 1, maxWidth: 240, height: 10, borderRadius: 5, background: 'linear-gradient(to right, #22c55e, #f59e0b, #ef4444)' }} />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)', fontWeight: 600 }}>1 (alta)</span>
              </div>

              {/* Matrix — full width, centered */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 4, margin: '0 auto' }}>
                  <thead>
                    <tr>
                      {/* empty top-left corner */}
                      <td style={{ width: 120 }} />
                      {series.map(s => (
                        <td key={s.entry.ticker} style={{ textAlign: 'center', paddingBottom: 8, minWidth: 110 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{s.entry.ticker}</span>
                          </div>
                        </td>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {series.map((rowS, i) => (
                      <tr key={rowS.entry.ticker}>
                        {/* Row label */}
                        <td style={{ paddingRight: 12, textAlign: 'right', verticalAlign: 'middle' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: rowS.color, flexShrink: 0 }} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>{rowS.entry.ticker}</span>
                          </div>
                        </td>
                        {/* Cells */}
                        {series.map((colS, j) => {
                          if (i === j) {
                            return (
                              <td key={colS.entry.ticker} style={{ minWidth: 110, height: 72, verticalAlign: 'middle' }}>
                                <div style={{ borderRadius: 10, background: 'var(--surface-2)', border: `2px solid ${rowS.color}40`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '10px 0' }}>
                                  <span style={{ fontSize: '1.3rem', fontWeight: 800, color: rowS.color }}>1.00</span>
                                  <span style={{ fontSize: '0.65rem', color: rowS.color, marginTop: 2, opacity: 0.8 }}>stesso ETF</span>
                                </div>
                              </td>
                            )
                          }
                          const r = pearson(corrMatrix[i], corrMatrix[j])
                          const bg = isNaN(r) ? 'var(--surface-2)' : corrColor(r)
                          return (
                            <td key={colS.entry.ticker} style={{ minWidth: 110, height: 72, verticalAlign: 'middle' }}>
                              <div style={{ borderRadius: 10, background: bg, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '10px 0', border: isNaN(r) ? '1px solid var(--border)' : 'none' }}>
                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                  {isNaN(r) ? '—' : r.toFixed(2)}
                                </span>
                                <span style={{ fontSize: '0.65rem', color: '#fff', marginTop: 2, opacity: 0.9 }}>
                                  {isNaN(r) ? '' : r < 0.3 ? 'bassa' : r < 0.7 ? 'media' : 'alta'}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Interpretation guide */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                {[
                  { range: 'r < 0.3', label: 'Bassa', desc: 'Ottima diversificazione', color: '#22c55e' },
                  { range: '0.3–0.7', label: 'Media', desc: 'Diversificazione parziale', color: '#f59e0b' },
                  { range: 'r > 0.7', label: 'Alta', desc: 'Sovrapposizione elevata', color: '#ef4444' },
                ].map(item => (
                  <div key={item.range} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 600 }}>{item.range}</span>
                    <span style={{ color: 'var(--text-2)' }}>— {item.label}: {item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function ComparatorPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 28px', color: 'var(--text-2)' }}>Caricamento…</div>}>
      <ComparatorContent />
    </Suspense>
  )
}
