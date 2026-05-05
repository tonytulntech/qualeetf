'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Trash2, Play, TrendingUp, TrendingDown, Info, Plus } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, ReferenceLine, PieChart, Pie, Cell } from 'recharts'
import { ETF_CATALOG, searchCatalog, type ETFEntry } from '@/lib/etf-catalog'

type Instrument = { id: number; ticker: string; isin: string; name: string; type: string; provider: string; currency: string }
type PriceRow = { date: string; close: number }
type ETFSlot = { instrument: Instrument; weight: number; prices: PriceRow[] }

function catalogToInstrument(e: ETFEntry): Instrument {
  return { id: e.id, ticker: e.ticker, isin: e.isin, name: e.name, type: e.type, provider: e.provider, currency: '' }
}

type RollingPoint = {
  date: string; label: string;
  ret_1:     number|null; ret_3:     number|null; ret_5:     number|null; ret_10:     number|null;
  vol_1:     number|null; vol_3:     number|null; vol_5:     number|null; vol_10:     number|null;
  sh_1:      number|null; sh_3:      number|null; sh_5:      number|null; sh_10:      number|null;
  sortino_1: number|null; sortino_3: number|null; sortino_5: number|null; sortino_10: number|null;
  calmar_1:  number|null; calmar_3:  number|null; calmar_5:  number|null; calmar_10:  number|null;
  ulcer_1:   number|null; ulcer_3:   number|null; ulcer_5:   number|null; ulcer_10:   number|null;
}

type BTResult = {
  chartData: { date: string; portfolio: number; invested: number; label: string }[]
  ddData: { date: string; dd: number; label: string }[]
  monthlyReturns: { ym: string; r: number }[]
  rollingData: RollingPoint[]
  cagr: number
  totalReturn: number
  volatility: number
  sharpe: number
  sortino: number
  calmar: number
  ulcerIndex: number
  upi: number
  posMonths: number
  maxDrawdown: number
  finalValue: number
  totalInvested: number
  months: number
}

function fmt(n: number, d = 2) { return n.toFixed(d).replace('.', ',') }
function fmtEur(n: number) { return '€\u202f' + Math.round(n).toLocaleString('it-IT') }

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

// Build monthly map with forward-fill for missing months
function toMonthlyFilled(prices: PriceRow[], allMonths: string[]): Record<string, number> {
  const raw: Record<string, number> = {}
  for (const p of prices) raw[p.date.slice(0, 7)] = p.close
  const filled: Record<string, number> = {}
  let last = 0
  for (const m of allMonths) {
    if (raw[m] != null) last = raw[m]
    if (last > 0) filled[m] = last
  }
  return filled
}

function runBacktest(slots: ETFSlot[], startYM: string, monthly: number, lump: number, growAmount = 0, growFreqMonths = 12): BTResult | null {
  if (!slots.length) return null
  // Find the earliest common start across all ETFs
  const earliestPerSlot = slots.map(s => s.prices[0]?.date?.slice(0, 7) ?? '9999-99')
  const earliestCommon = earliestPerSlot.reduce((a, b) => a > b ? a : b)
  const effectiveStart = startYM > earliestCommon ? startYM : earliestCommon
  const allMonths = genMonths('1990-01')
  const maps = slots.map(s => toMonthlyFilled(s.prices, allMonths))
  const valid = genMonths(effectiveStart).filter(m => maps.every(mp => mp[m] != null))
  if (valid.length < 3) return null

  const W = slots.map(s => s.weight / 100)
  const shares = slots.map(() => 0)
  let invested = 0
  let currentMonthly = monthly
  const chartData: BTResult['chartData'] = []
  const pvs: number[] = []

  for (let i = 0; i < valid.length; i++) {
    const ym = valid[i]
    const prices = maps.map(mp => mp[ym])
    // Aumento periodico del versamento
    if (growAmount > 0 && i > 0 && i % growFreqMonths === 0) currentMonthly += growAmount
    const contrib = i === 0 ? lump + currentMonthly : currentMonthly
    invested += contrib
    for (let j = 0; j < slots.length; j++) {
      if (prices[j] > 0) shares[j] += (contrib * W[j]) / prices[j]
    }
    const pv = shares.reduce((s, sh, j) => s + sh * prices[j], 0)
    pvs.push(pv)
    const [y, mo] = ym.split('-')
    const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
    chartData.push({ date: ym, portfolio: Math.round(pv), invested: Math.round(invested), label })
  }

  let peak = 0
  const ddData = pvs.map((pv, i) => {
    if (pv > peak) peak = pv
    return { date: valid[i], dd: peak > 0 ? parseFloat(((pv - peak) / peak * 100).toFixed(2)) : 0, label: chartData[i].label }
  })

  const finalValue = pvs[pvs.length - 1]
  const totalReturn = (finalValue - invested) / invested * 100

  const mReturns: number[] = []
  for (let i = 1; i < valid.length; i++) {
    let r = 0
    for (let j = 0; j < slots.length; j++) {
      const p0 = maps[j][valid[i - 1]], p1 = maps[j][valid[i]]
      if (p0 > 0) r += W[j] * (p1 / p0 - 1)
    }
    mReturns.push(r)
  }
  // TWRR: prodotto concatenato dei ritorni mensili, indipendente dai versamenti PAC
  const cagr = mReturns.length > 0
    ? (mReturns.reduce((p, r) => p * (1 + r), 1) ** (12 / mReturns.length) - 1) * 100
    : 0
  const avg = mReturns.reduce((a, b) => a + b, 0) / mReturns.length
  const vol = Math.sqrt(mReturns.reduce((a, r) => a + (r - avg) ** 2, 0) / mReturns.length * 12) * 100
  const RF = 2.5
  const sharpe = vol > 0 ? (cagr - RF) / vol : 0

  // Sortino: downside deviation (negative returns only)
  const negR = mReturns.filter(r => r < 0)
  const downDev = negR.length > 0
    ? Math.sqrt(negR.reduce((a, r) => a + r ** 2, 0) / mReturns.length * 12) * 100
    : 0.0001
  const sortino = (cagr - RF) / downDev

  const maxDrawdown = Math.min(...ddData.map(d => d.dd))

  // Calmar: CAGR / abs(maxDrawdown)
  const calmar = maxDrawdown !== 0 ? cagr / Math.abs(maxDrawdown) : 0

  // Ulcer Index: RMS of drawdown series
  const ddVals = ddData.map(d => d.dd)
  const ulcerIndex = Math.sqrt(ddVals.reduce((a, d) => a + d ** 2, 0) / ddVals.length)

  // UPI (Martin Ratio)
  const upi = ulcerIndex > 0 ? (cagr - RF) / ulcerIndex : 0

  // % Mesi positivi
  const posMonths = mReturns.length > 0
    ? (mReturns.filter(r => r > 0).length / mReturns.length) * 100
    : 0

  const monthlyReturns = mReturns.map((r, i) => ({ ym: valid[i + 1], r: r * 100 }))

  // Normalized composite price index (buy-and-hold, rebalanced at start)
  const base = maps.map(mp => mp[valid[0]])
  const compositePrice = valid.map(ym =>
    slots.reduce((s, _, j) => s + W[j] * (maps[j][ym] / base[j]), 0)
  )
  // Monthly returns of the composite (needed for rolling vol/sharpe)
  const cpMonthlyRet: number[] = []
  for (let i = 1; i < compositePrice.length; i++) {
    cpMonthlyRet.push(compositePrice[i] / compositePrice[i - 1] - 1)
  }
  const rollingData: RollingPoint[] = valid.map((ym, i) => {
    const [y, mo] = ym.split('-')
    const label = new Date(Number(y), Number(mo) - 1).toLocaleDateString('it-IT', { month: 'short', year: '2-digit' })
    const calc = (n: number) => {
      if (i < n) return { ret: null as null, vol: null as null, sh: null as null, sortino: null as null, calmar: null as null, ulcer: null as null }
      const ret = ((compositePrice[i] / compositePrice[i - n]) ** (12 / n) - 1) * 100
      const wr = cpMonthlyRet.slice(i - n, i) // n monthly returns in window
      if (wr.length < 2) return { ret, vol: null as null, sh: null as null, sortino: null as null, calmar: null as null, ulcer: null as null }
      // Volatility (annualizzata)
      const avg = wr.reduce((a, b) => a + b, 0) / wr.length
      const vol = Math.sqrt(wr.reduce((a, r) => a + (r - avg) ** 2, 0) / wr.length * 12) * 100
      // Sharpe
      const sh = vol > 0 ? (ret - RF) / vol : null
      // Sortino (downside deviation annualizzata)
      const negSq = wr.reduce((a, r) => a + Math.min(r, 0) ** 2, 0)
      const downDev = Math.sqrt(negSq / wr.length * 12) * 100
      const sortino = downDev > 0 ? (ret - RF) / downDev : null
      // Drawdown rolling sulla finestra (per Calmar e Ulcer)
      let peak = compositePrice[i - n]
      let maxDD = 0
      let sumDDSq = 0
      for (let k = i - n; k <= i; k++) {
        if (compositePrice[k] > peak) peak = compositePrice[k]
        const dd = peak > 0 ? (compositePrice[k] - peak) / peak * 100 : 0
        if (dd < maxDD) maxDD = dd
        sumDDSq += dd * dd
      }
      const calmar = maxDD < 0 ? ret / Math.abs(maxDD) : null
      const ulcer = Math.sqrt(sumDDSq / (n + 1))
      return { ret, vol, sh, sortino, calmar, ulcer }
    }
    const [c1, c3, c5, c10] = [12, 36, 60, 120].map(calc)
    return {
      date: ym, label,
      ret_1:     c1.ret,     ret_3:     c3.ret,     ret_5:     c5.ret,     ret_10:     c10.ret,
      vol_1:     c1.vol,     vol_3:     c3.vol,     vol_5:     c5.vol,     vol_10:     c10.vol,
      sh_1:      c1.sh,      sh_3:      c3.sh,      sh_5:      c5.sh,      sh_10:      c10.sh,
      sortino_1: c1.sortino, sortino_3: c3.sortino, sortino_5: c5.sortino, sortino_10: c10.sortino,
      calmar_1:  c1.calmar,  calmar_3:  c3.calmar,  calmar_5:  c5.calmar,  calmar_10:  c10.calmar,
      ulcer_1:   c1.ulcer,   ulcer_3:   c3.ulcer,   ulcer_5:   c5.ulcer,   ulcer_10:   c10.ulcer,
    }
  })

  return { chartData, ddData, monthlyReturns, rollingData, cagr, totalReturn, volatility: vol, sharpe, sortino, calmar, ulcerIndex, upi, posMonths, maxDrawdown, finalValue, totalInvested: invested, months: valid.length }
}

function InfoTooltip({ text }: { text: string }) {
  const [show, setShow] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
      <span
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{ cursor: 'help', color: 'var(--text-3)', fontSize: '0.68rem', userSelect: 'none', lineHeight: 1 }}
      >ⓘ</span>
      {show && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: 0,
          background: 'var(--surface)', border: '1px solid var(--border-2)',
          borderRadius: 8, padding: '8px 12px', width: 210, zIndex: 200,
          fontSize: '0.72rem', color: 'var(--text-2)', lineHeight: 1.55,
          boxShadow: '0 4px 20px rgba(0,0,0,0.35)', pointerEvents: 'none', display: 'block',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 160 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ fontSize: '0.875rem', fontWeight: 700, color: p.color, marginBottom: 2 }}>
          {p.name}: {fmtEur(p.value)}
        </div>
      ))}
    </div>
  )
}

function DDTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--red)' }}>{fmt(payload[0].value)}%</div>
    </div>
  )
}

const MONTHS_IT = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

function heatColor(r: number | undefined): string {
  if (r === undefined) return 'var(--surface-2)'
  const intensity = Math.min(Math.abs(r) / 8, 1)
  if (r > 0) return `rgba(74, 222, 128, ${0.12 + intensity * 0.65})`
  if (r < 0) return `rgba(248, 113, 113, ${0.12 + intensity * 0.65})`
  return 'var(--surface-2)'
}

const HEATMAP_DEFAULT_YEARS = 5

function ReturnsHeatmap({ monthlyReturns }: { monthlyReturns: { ym: string; r: number }[] }) {
  const [showAll, setShowAll] = useState(false)
  const byYear: Record<number, Record<number, number>> = {}
  for (const { ym, r } of monthlyReturns) {
    if (!ym) continue
    const [y, m] = ym.split('-').map(Number)
    if (!byYear[y]) byYear[y] = {}
    byYear[y][m] = r
  }
  const allYears = Object.keys(byYear).map(Number).sort((a, b) => b - a)
  const years = showAll ? allYears : allYears.slice(0, HEATMAP_DEFAULT_YEARS)

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: 580 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '48px repeat(12, 1fr) 64px', gap: 2, marginBottom: 4 }}>
            <div />
            {MONTHS_IT.map(m => (
              <div key={m} style={{ fontSize: '0.65rem', color: 'var(--text-3)', textAlign: 'center', fontWeight: 500 }}>{m}</div>
            ))}
            <div style={{ fontSize: '0.65rem', color: 'var(--text-3)', textAlign: 'center', fontWeight: 600 }}>Anno</div>
          </div>
          {years.map(y => {
            const mVals = Object.values(byYear[y])
            const annualR = (mVals.reduce((acc, r) => acc * (1 + r / 100), 1) - 1) * 100
            return (
              <div key={y} style={{ display: 'grid', gridTemplateColumns: '48px repeat(12, 1fr) 64px', gap: 2, marginBottom: 2 }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-2)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 6 }}>{y}</div>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => {
                  const r = byYear[y][m]
                  return (
                    <div key={m} title={r !== undefined ? `${y}-${String(m).padStart(2, '0')}: ${r >= 0 ? '+' : ''}${fmt(r)}%` : '—'}
                      style={{ height: 26, borderRadius: 4, background: heatColor(r), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.58rem', fontWeight: 600, color: r !== undefined && Math.abs(r) > 4 ? 'rgba(0,0,0,0.6)' : 'var(--text-2)', cursor: 'default' }}>
                      {r !== undefined ? `${r >= 0 ? '+' : ''}${r.toFixed(1)}` : ''}
                    </div>
                  )
                })}
                <div style={{ height: 26, borderRadius: 4, background: heatColor(annualR), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-1)' }}>
                  {annualR >= 0 ? '+' : ''}{fmt(annualR, 1)}%
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {allYears.length > HEATMAP_DEFAULT_YEARS && (
        <button onClick={() => setShowAll(v => !v)}
          style={{ marginTop: 12, background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600, padding: 0 }}>
          {showAll ? '↑ Mostra meno' : `↓ Mostra tutti gli anni (${allYears.length})`}
        </button>
      )}
    </div>
  )
}

const ROLLING_PERIODS = [
  { key: '1',  label: '1A',  n: 12  },
  { key: '3',  label: '3A',  n: 36  },
  { key: '5',  label: '5A',  n: 60  },
  { key: '10', label: '10A', n: 120 },
] as const

const ROLLING_METRICS = [
  { key: 'ret',     label: 'Ritorno',    color: 'var(--accent)', isRatio: false },
  { key: 'vol',     label: 'Volatilità', color: '#f59e0b',       isRatio: false },
  { key: 'sh',      label: 'Sharpe',     color: '#a78bfa',       isRatio: true  },
  { key: 'sortino', label: 'Sortino',    color: '#60a5fa',       isRatio: true  },
  { key: 'calmar',  label: 'Calmar',     color: '#34d399',       isRatio: true  },
  { key: 'ulcer',   label: 'Ulcer',      color: '#fb923c',       isRatio: false },
] as const

type RollingPeriod = typeof ROLLING_PERIODS[number]['key']
type RollingMetric = typeof ROLLING_METRICS[number]['key']

function RollingTooltip({ active, payload, label, isRatio }: any) {
  if (!active || !payload?.length) return null
  const val: number | null = payload[0]?.value
  if (val == null) return null
  return (
    <div className="card-sm" style={{ padding: '10px 14px', minWidth: 120 }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: payload[0]?.stroke }}>
        {isRatio ? val.toFixed(2) : `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`}
      </div>
    </div>
  )
}

function RollingChart({ data }: { data: RollingPoint[] }) {
  const [period, setPeriod] = useState<RollingPeriod>('3')
  const [metric, setMetric] = useState<RollingMetric>('ret')

  const dataKey = `${metric}_${period}` as keyof RollingPoint
  const metaCfg = ROLLING_METRICS.find(m => m.key === metric)!

  // Taglia i leading null: la linea parte dal primo mese con dato disponibile
  const firstIdx = data.findIndex(d => d[dataKey] != null)
  const chartData = firstIdx >= 0 ? data.slice(firstIdx) : []

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
        <div className="tab-group">
          {ROLLING_METRICS.map(m => (
            <button key={m.key} className={`tab${metric === m.key ? ' active' : ''}`} onClick={() => setMetric(m.key as RollingMetric)}>{m.label}</button>
          ))}
        </div>
        <div className="tab-group">
          {ROLLING_PERIODS.map(p => (
            <button key={p.key} className={`tab${period === p.key ? ' active' : ''}`} onClick={() => setPeriod(p.key)}>{p.label}</button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={Math.max(Math.floor(chartData.length / 8), 1)} />
          <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false}
            tickFormatter={v => metaCfg.isRatio ? v.toFixed(1) : `${v.toFixed(0)}%`} />
          {!metaCfg.isRatio && <ReferenceLine y={0} stroke="var(--border)" strokeWidth={1.5} />}
          <Tooltip content={<RollingTooltip isRatio={metaCfg.isRatio} />} />
          <Line type="monotone" dataKey={dataKey} stroke={metaCfg.color} strokeWidth={2} dot={false} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

const YEARS = [1993, 1995, 2000, 2005, 2010, 2015, 2020]

const PIE_COLORS = ['#4ade80', '#60a5fa', '#a78bfa', '#f59e0b', '#fb923c', '#f472b6', '#34d399', '#e879f9', '#fbbf24', '#38bdf8']

function DonutCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  if (!data.length) return null
  return (
    <div className="card" style={{ padding: '20px' }}>
      <div className="label" style={{ marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <PieChart width={110} height={110}>
          <Pie data={data} cx={55} cy={55} innerRadius={32} outerRadius={50} dataKey="value" paddingAngle={2} strokeWidth={0}>
            {data.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
          </Pie>
        </PieChart>
        <div style={{ flex: 1, minWidth: 0 }}>
          {data.map((d, i) => (
            <div key={d.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5, gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[i % PIE_COLORS.length], flexShrink: 0 }} />
                <span style={{ fontSize: '0.74rem', color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</span>
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-1)', flexShrink: 0 }}>{d.value.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ComposizioneTab({ slots }: { slots: ETFSlot[] }) {
  const entries = slots.map(s => {
    const cat = ETF_CATALOG.find(e => e.ticker === s.instrument.ticker)
    return {
      name: s.instrument.name,
      ticker: s.instrument.ticker,
      weight: s.weight,
      category: cat?.category ?? 'Altro',
      subCategory: cat?.subCategory ?? 'Altro',
      provider: cat?.provider ?? s.instrument.provider ?? 'Altro',
      ter: cat?.ter ?? 0,
      type: s.instrument.type,
    }
  })

  const groupBy = (key: 'category' | 'subCategory' | 'provider') => {
    const map: Record<string, number> = {}
    for (const e of entries) {
      const k = e[key]
      map[k] = (map[k] ?? 0) + e.weight
    }
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))
  }

  const terPonderato = entries.reduce((s, e) => s + e.ter * e.weight / 100, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Donut charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <DonutCard title="Categoria" data={groupBy('category')} />
        <DonutCard title="Sub-categoria" data={groupBy('subCategory')} />
        <DonutCard title="Provider" data={groupBy('provider')} />
      </div>

      {/* ETF table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="label">Strumenti nel portafoglio</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>
            TER ponderato: <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{terPonderato.toFixed(2)}%</span>
          </div>
        </div>
        <div style={{ padding: '8px 20px 4px', background: 'var(--surface-2)', display: 'grid', gridTemplateColumns: '1fr 80px 100px 60px 50px', gap: 12 }}>
          {['Strumento', 'Categoria', 'Sub-cat.', 'TER', 'Peso'].map(h => (
            <div key={h} className="label" style={{ fontSize: '0.68rem' }}>{h}</div>
          ))}
        </div>
        {entries.map(e => (
          <div key={e.ticker} style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 80px 100px 60px 50px', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.84rem', marginBottom: 2 }}>{e.name}</div>
              <div style={{ display: 'flex', gap: 5 }}>
                <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{e.ticker}</span>
                <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{e.type}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{e.category}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{e.subCategory}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-2)' }}>{e.ter.toFixed(2)}%</div>
            <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{e.weight}%</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function BacktestContent() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [searchRes, setSearchRes] = useState<Instrument[]>([])
  const [slots, setSlots] = useState<ETFSlot[]>([])
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [monthly, setMonthly] = useState(0)
  const [lump, setLump] = useState(100)
  const [startYear, setStartYear] = useState(2010)
  const [growAmount, setGrowAmount] = useState(0)
  const [growFreqMonths, setGrowFreqMonths] = useState(12)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<BTResult | null>(null)
  const [btError, setBtError] = useState<string | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [activeTab, setActiveTab] = useState<'performance' | 'composizione'>('performance')

  // Restore from localStorage or URL param on mount
  useEffect(() => {
    const ticker = searchParams.get('ticker')
    if (ticker) {
      const entry = ETF_CATALOG.find(e => e.ticker === ticker)
      if (entry) addETF(catalogToInstrument(entry))
      return
    }
    try {
      const saved = localStorage.getItem('cheEtf_bt_v1')
      if (!saved) return
      const data = JSON.parse(saved)
      if (typeof data.monthly === 'number') setMonthly(data.monthly)
      if (typeof data.lump === 'number') setLump(data.lump)
      if (typeof data.startYear === 'number') setStartYear(data.startYear)
      if (typeof data.growAmount === 'number') setGrowAmount(data.growAmount)
      if (typeof data.growFreqMonths === 'number') setGrowFreqMonths(data.growFreqMonths)
      const savedSlots: { ticker: string; weight: number }[] = data.slots ?? []
      if (!savedSlots.length) return
      Promise.all(savedSlots.map(async ({ ticker: t, weight: w }) => {
        const entry = ETF_CATALOG.find(e => e.ticker === t)
        if (!entry) return null
        try {
          const res = await fetch(`/api/prices/${encodeURIComponent(t)}`)
          const { real = [], synthetic = [] } = await res.json()
          const prices: PriceRow[] = [...synthetic, ...real].sort((a, b) => a.date < b.date ? -1 : 1)
          return { instrument: catalogToInstrument(entry), weight: w, prices } as ETFSlot
        } catch { return null }
      })).then(results => {
        const valid = results.filter(Boolean) as ETFSlot[]
        if (valid.length) setSlots(valid)
      })
    } catch {}
  }, []) // eslint-disable-line

  // Persist to localStorage on every change
  useEffect(() => {
    if (!slots.length) return
    try {
      localStorage.setItem('cheEtf_bt_v1', JSON.stringify({
        slots: slots.map(s => ({ ticker: s.instrument.ticker, weight: s.weight })),
        monthly, lump, startYear, growAmount, growFreqMonths,
      }))
    } catch {}
  }, [slots, monthly, lump, startYear, growAmount, growFreqMonths])

  useEffect(() => {
    if (!query.trim()) { setSearchRes([]); return }
    const t = setTimeout(() => {
      const results = searchCatalog(query, 8).map(catalogToInstrument)
      setSearchRes(results)
    }, 150)
    return () => clearTimeout(t)
  }, [query])

  async function addETF(inst: Instrument) {
    if (slots.find(s => s.instrument.id === inst.id)) { setQuery(''); setSearchRes([]); return }
    setLoadingId(inst.id)
    try {
      const res = await fetch(`/api/prices/${encodeURIComponent(inst.ticker)}`)
      const { real = [], synthetic = [] } = await res.json()
      const all: PriceRow[] = [...synthetic, ...real].sort((a: PriceRow, b: PriceRow) => a.date < b.date ? -1 : 1)
      setSlots(prev => {
        const next = [...prev, { instrument: inst, weight: 0, prices: all }]
        const eq = Math.floor(100 / next.length), rem = 100 - eq * next.length
        return next.map((s, i) => ({ ...s, weight: i === 0 ? eq + rem : eq }))
      })
    } finally {
      setQuery(''); setSearchRes([]); setShowSearch(false); setLoadingId(null); setResult(null)
    }
  }

  function remove(id: number) {
    setSlots(prev => {
      const next = prev.filter(s => s.instrument.id !== id)
      if (!next.length) return next
      const eq = Math.floor(100 / next.length), rem = 100 - eq * next.length
      return next.map((s, i) => ({ ...s, weight: i === 0 ? eq + rem : eq }))
    })
    setResult(null)
  }

  function setWeight(id: number, v: number) {
    setSlots(prev => prev.map(s => s.instrument.id === id ? { ...s, weight: v } : s))
    setResult(null)
  }

  const totalW = slots.reduce((s, sl) => s + sl.weight, 0)
  const canRun = slots.length > 0 && totalW === 100

  function handleRun() {
    if (!canRun) return
    setBtError(null)

    // Check missing prices
    const empty = slots.filter(s => s.prices.length === 0)
    if (empty.length > 0) {
      setBtError(`Prezzi non disponibili per: ${empty.map(s => s.instrument.ticker).join(', ')}. Questi ETF potrebbero non avere dati storici nel database.`)
      return
    }

    // Check minimum common months
    const allM = genMonths('1990-01')
    const maps = slots.map(s => toMonthlyFilled(s.prices, allM))
    const startYM = `${startYear}-01`
    const common = genMonths(startYM).filter(m => maps.every(mp => mp[m] != null))
    if (common.length < 3) {
      const perSlot = slots.map((s, i) => {
        const keys = Object.keys(maps[i]).sort()
        return `${s.instrument.ticker} (dati: ${keys[0] ?? '—'} → ${keys[keys.length - 1] ?? '—'})`
      })
      setBtError(`Nessun mese comune dal ${startYear}. Storia disponibile:\n${perSlot.join('\n')}`)
      return
    }

    setRunning(true)
    setTimeout(() => {
      setResult(runBacktest(slots, startYM, monthly, lump, growAmount, growFreqMonths))
      setRunning(false)
    }, 30)
  }

  const isUp = result && result.totalReturn >= 0

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

      <div style={{ marginBottom: 32 }}>
        <div className="label" style={{ marginBottom: 8 }}>Simulatore</div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Backtest PAC
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem' }}>
          Simula un piano di accumulo su più ETF con storia dal 1993. Nessun limite di strumenti.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

        {/* Left: ETF builder */}
        <div>
          <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: slots.length ? '1px solid var(--border)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 600 }}>Portafoglio</div>
              <button className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: '0.8rem', gap: 5 }}
                onClick={() => setShowSearch(v => !v)}>
                <Plus size={13} /> Aggiungi ETF
              </button>
            </div>

            {/* Search box */}
            {showSearch && (
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', position: 'relative' }}>
                <div style={{ position: 'relative' }}>
                  <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                  <input className="input" style={{ paddingLeft: 36 }} autoFocus
                    placeholder="Cerca per nome, ticker o ISIN…"
                    value={query} onChange={e => setQuery(e.target.value)} />
                </div>
                {searchRes.length > 0 && (
                  <div className="card" style={{ position: 'absolute', left: 20, right: 20, zIndex: 50, marginTop: 6, padding: 0, overflow: 'hidden' }}>
                    {searchRes.map(inst => (
                      <button key={inst.id} onClick={() => addETF(inst)}
                        disabled={loadingId === inst.id || !!slots.find(s => s.instrument.id === inst.id)}
                        style={{ width: '100%', textAlign: 'left', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', opacity: slots.find(s => s.instrument.id === inst.id) ? 0.4 : 1 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{inst.name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>{inst.ticker} · {inst.type} · <span style={{ color: 'var(--text-3)' }}>{inst.isin}</span></div>
                        </div>
                        {loadingId === inst.id && <div style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Slots */}
            {slots.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-3)', fontSize: '0.875rem' }}>
                Aggiungi almeno un ETF per iniziare
              </div>
            ) : (
              <>
                <div style={{ padding: '10px 20px', background: 'var(--surface-2)', display: 'grid', gridTemplateColumns: '1fr 110px 40px', gap: 12 }}>
                  <div className="label" style={{ fontSize: '0.7rem' }}>Strumento</div>
                  <div className="label" style={{ fontSize: '0.7rem' }}>Peso (%)</div>
                  <div />
                </div>
                {slots.map(slot => (
                  <div key={slot.instrument.id} style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 110px 40px', gap: 12, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{slot.instrument.name}</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <span className="badge badge-muted" style={{ fontSize: '0.68rem' }}>{slot.instrument.ticker}</span>
                        <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>{slot.instrument.type}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input type="number" min={0} max={100} className="input" style={{ width: 64, padding: '6px 10px', textAlign: 'right' }}
                        value={slot.weight} onChange={e => setWeight(slot.instrument.id, Number(e.target.value))} />
                      <span style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>%</span>
                    </div>
                    <button onClick={() => remove(slot.instrument.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: totalW === 100 ? 'var(--green)' : 'var(--red)' }}>
                    Totale: {totalW}%
                    {totalW !== 100 && <span style={{ fontWeight: 400, color: 'var(--text-2)', marginLeft: 6 }}>(deve fare 100%)</span>}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Error */}
          {btError && (
            <div className="card" style={{ padding: '16px 20px', marginBottom: 20, border: '1px solid var(--red)', color: 'var(--red)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
              ⚠ {btError}
            </div>
          )}

          {/* Tabs */}
          {slots.length > 0 && (
            <div className="tab-group" style={{ marginBottom: 16 }}>
              <button className={`tab${activeTab === 'performance' ? ' active' : ''}`} onClick={() => setActiveTab('performance')}>Performance</button>
              <button className={`tab${activeTab === 'composizione' ? ' active' : ''}`} onClick={() => setActiveTab('composizione')}>Composizione</button>
            </div>
          )}

          {/* Composizione tab */}
          {activeTab === 'composizione' && slots.length > 0 && (
            <ComposizioneTab slots={slots} />
          )}

          {/* Results */}
          {result && activeTab === 'performance' && (
            <div>
              {/* Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Rendimento totale', value: `${result.totalReturn >= 0 ? '+' : ''}${fmt(result.totalReturn)}%`, color: result.totalReturn >= 0 ? 'var(--green)' : 'var(--red)', info: 'Guadagno netto del PAC: (valore finale − totale versato) / totale versato. Dipende dal timing dei versamenti, non confrontabile direttamente tra strategie diverse.' },
                  { label: 'CAGR (TWRR)', value: `${result.cagr >= 0 ? '+' : ''}${fmt(result.cagr)}%`, color: result.cagr >= 0 ? 'var(--green)' : 'var(--red)', info: 'Rendimento annuo composto del prezzo (Time-Weighted Rate of Return). Indipendente dai versamenti PAC — confrontabile con altri strumenti e benchmark.' },
                  { label: 'Volatilità', value: `${fmt(result.volatility)}%`, color: 'var(--text-1)', info: 'Deviazione standard annualizzata dei rendimenti mensili (σ × √12). Misura l\'ampiezza delle oscillazioni: più alto = più rischioso.' },
                  { label: 'Max Drawdown', value: `${fmt(result.maxDrawdown)}%`, color: 'var(--red)', info: 'Massima perdita dal picco alla valle nell\'intero periodo. Es: −52% = il portafoglio ha perso la metà dal suo massimo storico prima di recuperare.' },
                  { label: 'Sharpe', value: fmt(result.sharpe), color: 'var(--text-1)', info: '(CAGR − tasso risk-free 2,5%) / Volatilità. Misura il rendimento extra per unità di rischio totale. >1 = ottimo, 0,5–1 = buono, <0,5 = mediocre.' },
                  { label: 'Sortino', value: fmt(result.sortino), color: 'var(--text-1)', info: '(CAGR − rf) / downside deviation. Come Sharpe, ma divide solo per la volatilità dei mesi negativi. Premia chi perde meno nei ribassi.' },
                  { label: 'Calmar', value: fmt(result.calmar), color: 'var(--text-1)', info: 'CAGR / |Max Drawdown|. Rendimento ottenuto per ogni punto % di perdita massima storica. Utile per chi è molto sensibile ai drawdown.' },
                  { label: 'Ulcer Index', value: `${fmt(result.ulcerIndex)}%`, color: 'var(--text-1)', info: 'Media quadratica di tutti i drawdown storici (non solo il massimo). Penalizza sia la profondità che la durata dei ribassi. Valori bassi = meno "sofferenza".' },
                  { label: 'UPI', value: fmt(result.upi), color: 'var(--text-1)', info: 'Ulcer Performance Index: (CAGR − rf) / Ulcer Index. Simile a Sharpe ma usa l\'Ulcer Index come rischio — più stabile del Calmar.' },
                  { label: '% Mesi Positivi', value: `${fmt(result.posMonths)}%`, color: 'var(--text-1)', info: 'Percentuale di mesi con rendimento positivo. L\'MSCI World ha storicamente ≈ 63–64%. Valori alti non implicano necessariamente rendimenti elevati.' },
                  { label: 'Durata analisi', value: `${Math.round(result.months / 12)} anni`, color: 'var(--text-1)', info: 'Periodo totale analizzato, dalla prima data disponibile (reale o proxy) fino al mese corrente.' },
                  { label: 'Num. versamenti', value: `${result.months}`, color: 'var(--text-1)', info: 'Numero di mesi simulati = numero di versamenti mensili effettuati nel PAC.' },
                ].map(m => (
                  <div key={m.label} className="card" style={{ padding: '14px 16px' }}>
                    <div className="label" style={{ marginBottom: 6, fontSize: '0.68rem', display: 'flex', alignItems: 'center' }}>
                      {m.label}<InfoTooltip text={m.info} />
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Valore finale portafoglio</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--accent)' }}>{fmtEur(result.finalValue)}</div>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Totale investito</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{fmtEur(result.totalInvested)}</div>
                </div>
                <div>
                  <div className="label" style={{ marginBottom: 4 }}>Guadagno netto</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.03em', color: (result.finalValue - result.totalInvested) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {(result.finalValue - result.totalInvested) >= 0 ? '+' : ''}{fmtEur(result.finalValue - result.totalInvested)}
                  </div>
                </div>
              </div>

              {/* Growth chart */}
              <div className="card" style={{ padding: '24px 20px', marginBottom: 20 }}>
                <div className="label" style={{ marginBottom: 16 }}>Crescita portafoglio</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart key="growth" data={result.chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gPort" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gInv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--text-3)" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="var(--text-3)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={Math.max(Math.floor(result.chartData.length / 8), 1)} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={v => `€${(v/1000).toFixed(0)}k`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="portfolio" name="Portafoglio" stroke="var(--accent)" strokeWidth={2} fill="url(#gPort)" dot={false} />
                    <Area type="monotone" dataKey="invested" name="Investito" stroke="var(--text-3)" strokeWidth={1.5} fill="url(#gInv)" dot={false} strokeDasharray="4 3" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Drawdown chart */}
              <div className="card" style={{ padding: '24px 20px', marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div className="label">Drawdown</div>
                  <span className="badge badge-down" style={{ fontSize: '0.75rem' }}>Max {fmt(result.maxDrawdown)}%</span>
                </div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart key="dd" data={result.ddData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gDD" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--red)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--red)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} interval={Math.max(Math.floor(result.ddData.length / 8), 1)} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                    <ReferenceLine y={0} stroke="var(--border)" />
                    <Tooltip content={<DDTooltip />} />
                    <Area type="monotone" dataKey="dd" stroke="var(--red)" strokeWidth={1.5} fill="url(#gDD)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Rolling analysis */}
              <div className="card" style={{ padding: '24px 20px', marginBottom: 20 }}>
                <div style={{ marginBottom: 16 }}>
                  <div className="label" style={{ marginBottom: 4 }}>Analisi Rolling</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Metrica calcolata su finestra mobile — annualizzata</div>
                </div>
                <RollingChart data={result.rollingData} />
              </div>

              {/* Heatmap rendimenti mensili */}
              <div className="card" style={{ padding: '24px 20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <div className="label" style={{ marginBottom: 4 }}>Rendimenti mensili</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(74,222,128,0.6)', marginRight: 4, verticalAlign: 'middle' }} />
                    positivo
                    <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 2, background: 'rgba(248,113,113,0.6)', marginLeft: 10, marginRight: 4, verticalAlign: 'middle' }} />
                    negativo · colonna destra = rendimento annuale composto
                  </div>
                </div>
                <ReturnsHeatmap monthlyReturns={result.monthlyReturns} />
              </div>
            </div>
          )}
        </div>

        {/* Right: Settings panel */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Impostazioni PAC</div>

            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Versamento mensile</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>€</span>
                <input type="number" min={0} className="input" style={{ flex: 1 }}
                  value={monthly} onChange={e => { setMonthly(Number(e.target.value)); setResult(null) }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 8 }}>Investimento iniziale</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>€</span>
                <input type="number" min={0} className="input" style={{ flex: 1 }}
                  value={lump} onChange={e => { setLump(Number(e.target.value)); setResult(null) }} />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div className="label" style={{ marginBottom: 6 }}>Aumento periodico versamento</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ color: 'var(--text-2)', fontWeight: 600 }}>+€</span>
                <input type="number" min={0} className="input" style={{ flex: 1 }}
                  placeholder="0"
                  value={growAmount || ''} onChange={e => { setGrowAmount(Number(e.target.value)); setResult(null) }} />
              </div>
              <div className="tab-group" style={{ width: '100%' }}>
                {([['Mensile', 1], ['Trim.', 3], ['Semest.', 6], ['Annuale', 12]] as [string, number][]).map(([label, months]) => (
                  <button key={months} className={`tab${growFreqMonths === months ? ' active' : ''}`}
                    style={{ flex: 1, fontSize: '0.7rem' }}
                    onClick={() => { setGrowFreqMonths(months); setResult(null) }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div className="label" style={{ marginBottom: 8 }}>Anno di inizio</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {YEARS.map(y => (
                  <button key={y} className={`tab ${startYear === y ? 'active' : ''}`}
                    style={{ padding: '5px 10px', fontSize: '0.78rem' }}
                    onClick={() => { setStartYear(y); setResult(null) }}>
                    {y}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', padding: '13px', fontSize: '0.9375rem', gap: 8, justifyContent: 'center', opacity: canRun ? 1 : 0.5, cursor: canRun ? 'pointer' : 'not-allowed' }}
              onClick={handleRun} disabled={!canRun || running}>
              {running ? 'Calcolo…' : <><Play size={15} /> Avvia Backtest</>}
            </button>

            {!canRun && slots.length > 0 && (
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--red)', textAlign: 'center' }}>
                I pesi devono sommare a 100%
              </div>
            )}
          </div>

        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function BacktestPage() {
  return (
    <Suspense fallback={<div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', color: 'var(--text-2)' }}>Caricamento…</div>}>
      <BacktestContent />
    </Suspense>
  )
}
