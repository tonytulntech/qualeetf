// ─── Types ────────────────────────────────────────────────────────────────────

export type InstrumentType =
  | 'fondo_attivo'
  | 'polizza_ramo1'
  | 'polizza_ramo3'
  | 'fondo_pensione'
  | 'etf'
  | 'index_fund'

export type ContributionFreq =
  | 'none'
  | 'mensile'
  | 'bimestrale'
  | 'trimestrale'
  | 'semestrale'
  | 'annuale'

export interface Costs {
  entry: number        // % one-time on capital invested
  exit: number         // % one-time on final value
  ter: number          // % annual (TER / management fee)
  performance: number  // % of positive return above 0 (simplification)
  other: number        // % annual other recurring costs
}

export interface AssetAllocation {
  monetario: number
  obbligazionario: number
  azionario_eu: number
  azionario_us: number
  azionario_em: number
  immobiliare: number
  altro: number
}

export interface InstrumentInput {
  id: string
  name: string
  isin: string
  type: InstrumentType
  initialCapital: number   // €
  horizon: number          // years
  expectedReturn: number   // % gross annual
  costs: Costs
  allocation: AssetAllocation
  contribution: number     // € per period
  contributionFreq: ContributionFreq
  color: string            // chart color
}

export interface YearPoint {
  year: number
  valueNoContrib: number    // only initial capital (net of all costs)
  valueWithContrib: number  // initial capital + contributions (net)
  grossNoContrib: number    // only initial capital (NO costs applied – for cost drag)
  totalInvested: number     // initial + all contributions injected so far
}

export interface SimResult {
  instrument: InstrumentInput
  points: YearPoint[]
  finalValueNoContrib: number
  finalValueWithContrib: number
  totalInvested: number
  totalCostDrag: number              // grossNoContrib_final - finalValueNoContrib (solo capitale iniziale)
  totalCostDragWithContrib: number   // grossWC_final - finalValueWithContrib (reale: include contributi)
  cagrNet: number          // CAGR net (no-contrib scenario)
  cagrGross: number        // expected gross annual return
  totalCostsRatePct: number // total annual cost rate %
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQ_MONTHS: Record<ContributionFreq, number> = {
  none: 0,
  mensile: 1,
  bimestrale: 2,
  trimestrale: 3,
  semestrale: 6,
  annuale: 12,
}

export const INSTRUMENT_LABELS: Record<InstrumentType, string> = {
  fondo_attivo: 'Fondo Attivo',
  polizza_ramo1: 'Polizza Ramo I',
  polizza_ramo3: 'Polizza Ramo III',
  fondo_pensione: 'Fondo Pensione',
  etf: 'ETF',
  index_fund: 'Index Fund',
}

export const CHART_COLORS = [
  '#B2E5F9', '#4ADE80', '#F87171', '#FBBF24',
  '#A78BFA', '#FB923C', '#34D399', '#F472B6',
]

// ─── Core simulation ──────────────────────────────────────────────────────────

export function simulate(inst: InstrumentInput): SimResult {
  const {
    initialCapital, horizon, expectedReturn,
    costs, contribution, contributionFreq,
  } = inst

  const annualCostRate = (costs.ter + costs.other) / 100
  const grossMonthlyRate = expectedReturn / 100 / 12
  const netMonthlyRate = grossMonthlyRate - annualCostRate / 12
  const perfFeeRate = costs.performance / 100
  const freqMonths = FREQ_MONTHS[contributionFreq]

  // Entry cost applied upfront
  const capitalAfterEntry = initialCapital * (1 - costs.entry / 100)

  let valueNC = capitalAfterEntry    // net, no contrib
  let valueWC = capitalAfterEntry    // net, with contrib
  let grossNC = capitalAfterEntry    // gross (no TER/perf/exit) for cost-drag calc
  let grossWC = capitalAfterEntry

  let totalInvested = initialCapital
  const points: YearPoint[] = []

  for (let year = 1; year <= horizon; year++) {
    for (let month = 1; month <= 12; month++) {
      // Inject contribution at the start of each contribution period
      if (freqMonths > 0 && month % freqMonths === 0) {
        const net = contribution * (1 - costs.entry / 100)
        valueWC += net
        grossWC += contribution
        totalInvested += contribution
      }

      // Monthly gross return
      const grossRetNC = valueNC * grossMonthlyRate
      const grossRetWC = valueWC * grossMonthlyRate

      // Performance fee on positive monthly return
      const perfNC = Math.max(0, grossRetNC) * perfFeeRate
      const perfWC = Math.max(0, grossRetWC) * perfFeeRate

      // Apply: gross return - TER drag - perf fee
      valueNC += grossRetNC - valueNC * (annualCostRate / 12) - perfNC
      valueWC += grossRetWC - valueWC * (annualCostRate / 12) - perfWC

      // Gross compound (zero fees) for cost-drag reference
      grossNC *= 1 + grossMonthlyRate
      grossWC *= 1 + grossMonthlyRate
    }

    // Apply exit costs only in the final year snapshot
    const exitMult = year === horizon ? 1 - costs.exit / 100 : 1

    points.push({
      year,
      valueNoContrib: valueNC * exitMult,
      valueWithContrib: valueWC * exitMult,
      grossNoContrib: grossNC,
      totalInvested,
    })
  }

  const finalNC = valueNC * (1 - costs.exit / 100)
  const finalWC = valueWC * (1 - costs.exit / 100)
  const totalCostDrag = grossNC - finalNC
  const totalCostDragWithContrib = grossWC - finalWC

  const cagrNet = finalNC > 0 && capitalAfterEntry > 0
    ? Math.pow(finalNC / capitalAfterEntry, 1 / horizon) - 1
    : 0

  return {
    instrument: inst,
    points,
    finalValueNoContrib: finalNC,
    finalValueWithContrib: finalWC,
    totalInvested,
    totalCostDrag,
    totalCostDragWithContrib,
    cagrNet,
    cagrGross: expectedReturn / 100,
    totalCostsRatePct: costs.entry / horizon + annualCostRate * 100 + costs.exit / horizon + costs.performance,
  }
}

// ─── Build chart data (all instruments merged) ────────────────────────────────

export interface ChartPoint {
  year: number
  label: string
  [key: string]: number | string  // dynamic keys per instrument
}

export function buildChartData(results: SimResult[], withContrib: boolean): ChartPoint[] {
  if (!results.length) return []
  const horizon = Math.max(...results.map(r => r.instrument.horizon))
  return Array.from({ length: horizon }, (_, i) => {
    const year = i + 1
    const obj: ChartPoint = { year, label: `Anno ${year}` }
    for (const r of results) {
      const pt = r.points[i]
      if (pt) {
        obj[r.instrument.id] = withContrib ? pt.valueWithContrib : pt.valueNoContrib
      }
    }
    return obj
  })
}

// ─── Cost breakdown per instrument ───────────────────────────────────────────

export interface CostBreakdown {
  id: string
  name: string
  entryTotal: number
  annualTotal: number
  exitTotal: number
  perfFeeTotal: number
  grandTotal: number
  color: string
}

export function buildCostBreakdown(results: SimResult[]): CostBreakdown[] {
  return results.map(r => {
    const { instrument: inst, finalValueWithContrib } = r
    // Use the real simulated cost drag (includes contributions & compounding)
    const recurringTotal = r.totalCostDragWithContrib
    const entryTotal = inst.initialCapital * inst.costs.entry / 100
    const exitTotal = finalValueWithContrib * inst.costs.exit / 100
    const perfFeeTotal = recurringTotal * (inst.costs.performance > 0 ? inst.costs.performance / (inst.costs.ter + inst.costs.other + inst.costs.performance || 1) : 0)
    const annualTotal = recurringTotal - perfFeeTotal
    return {
      id: inst.id,
      name: inst.name || 'Strumento',
      entryTotal,
      annualTotal,
      exitTotal,
      perfFeeTotal,
      grandTotal: entryTotal + recurringTotal + exitTotal,
      color: inst.color,
    }
  })
}

// ─── Aggregated asset allocation ──────────────────────────────────────────────

export interface AllocationSlice {
  name: string
  value: number
  color: string
}

const ALLOC_META: { key: keyof AssetAllocation; label: string; color: string }[] = [
  { key: 'monetario',       label: 'Monetario',           color: '#94A3B8' },
  { key: 'obbligazionario', label: 'Obbligazionario',     color: '#60A5FA' },
  { key: 'azionario_eu',   label: 'Azionario Europa',    color: '#4ADE80' },
  { key: 'azionario_us',   label: 'Azionario USA',       color: '#B2E5F9' },
  { key: 'azionario_em',   label: 'Mercati Emergenti',   color: '#FBBF24' },
  { key: 'immobiliare',    label: 'Immobiliare',         color: '#FB923C' },
  { key: 'altro',          label: 'Altro',               color: '#A78BFA' },
]

export function buildAggregatedAllocation(results: SimResult[]): AllocationSlice[] {
  const totals: Partial<Record<keyof AssetAllocation, number>> = {}
  const totalCapital = results.reduce((s, r) => s + r.instrument.initialCapital, 0)

  for (const r of results) {
    const weight = totalCapital > 0 ? r.instrument.initialCapital / totalCapital : 1 / results.length
    for (const meta of ALLOC_META) {
      const v = r.instrument.allocation[meta.key] * weight
      totals[meta.key] = (totals[meta.key] ?? 0) + v
    }
  }

  return ALLOC_META
    .map(m => ({ name: m.label, value: Math.round((totals[m.key] ?? 0) * 10) / 10, color: m.color }))
    .filter(s => s.value > 0)
}

// ─── KID text parser ──────────────────────────────────────────────────────────

export function parseKidAllocation(text: string): Partial<AssetAllocation> {
  const result: Partial<AssetAllocation> = {}
  const patterns: [keyof AssetAllocation, RegExp][] = [
    ['monetario',       /monetari[ao]|liquidit|money\s*market/i],
    ['obbligazionario', /obbligazionar|bond|fixed\s*income|reddito\s*fisso/i],
    ['azionario_eu',    /azionario\s*(europa|european|eu)|equity\s*(europa|eu)/i],
    ['azionario_us',    /azionario\s*(usa|america|stati\s*uniti)|equity\s*(usa|america)/i],
    ['azionario_em',    /emergen|emerging|paesi\s*emergenti/i],
    ['immobiliare',     /immobiliar|real\s*estate|reit/i],
    ['altro',           /altro|other|commodit|materie\s*prime/i],
  ]

  for (const [key, pat] of patterns) {
    // Try "label ... XX%" or "XX% ... label" within 80 chars
    const m = text.match(new RegExp(
      `${pat.source}.{0,80}?(\\d{1,3}(?:[,.]\\d+)?)\\s*%`, 'i'
    )) || text.match(new RegExp(
      `(\\d{1,3}(?:[,.]\\d+)?)\\s*%.{0,80}?${pat.source}`, 'i'
    ))
    if (m) {
      const val = parseFloat(m[1].replace(',', '.'))
      if (!isNaN(val) && val >= 0 && val <= 100) result[key] = val
    }
  }

  return result
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

export function fmtEur(n: number): string {
  return '€ ' + Math.round(n).toLocaleString('it-IT')
}

export function fmtPct(n: number, d = 2): string {
  return n.toFixed(d).replace('.', ',') + '%'
}

export const EMPTY_ALLOCATION: AssetAllocation = {
  monetario: 0, obbligazionario: 0,
  azionario_eu: 0, azionario_us: 0, azionario_em: 0,
  immobiliare: 0, altro: 0,
}

export const DEFAULT_INSTRUMENT = (id: string, colorIndex: number): InstrumentInput => ({
  id,
  name: '',
  isin: '',
  type: 'fondo_attivo',
  initialCapital: 10000,
  horizon: 10,
  expectedReturn: 5,
  costs: { entry: 0, exit: 0, ter: 1.5, performance: 0, other: 0 },
  allocation: { ...EMPTY_ALLOCATION },
  contribution: 0,
  contributionFreq: 'none',
  color: CHART_COLORS[colorIndex % CHART_COLORS.length],
})
