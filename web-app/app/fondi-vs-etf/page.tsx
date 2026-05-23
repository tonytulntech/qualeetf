'use client'
import { useState, useCallback, useMemo, useEffect } from 'react'
import dynamic from 'next/dynamic'
import {
  Plus, Trash2, ChevronDown, ChevronUp, Info, Flame,
  TrendingDown, AlertTriangle, Download, BarChart3, PieChart as PieIcon,
  Scale, Layers, Zap, TrendingUp, Check,
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts'
import {
  simulate, buildChartData, buildCostBreakdown, buildAggregatedAllocation,
  parseKidAllocation, fmtEur, fmtPct,
  DEFAULT_INSTRUMENT, INSTRUMENT_LABELS, CHART_COLORS, EMPTY_ALLOCATION,
  type InstrumentInput, type InstrumentType, type ContributionFreq,
  type SimResult, type AssetAllocation,
} from '@/lib/comparatore-calc'

// PDF loaded client-side only
const PdfDownloadButton = dynamic(() => import('./PdfReport'), { ssr: false, loading: () => (
  <button className="btn btn-ghost" style={{ opacity: 0.5 }}>
    <Download size={14} /> Caricamento PDF…
  </button>
) })

// ─── Types ────────────────────────────────────────────────────────────────────

interface EtfBenchmark {
  enabled: boolean
  name: string
  ter: number
  expectedReturn: number
  capital: number     // 0 = usa capitale primo strumento
  horizon: number     // 0 = usa orizzonte primo strumento
  contribution: number
  contributionFreq: ContributionFreq
}

const DEFAULT_ETF_BENCHMARK: EtfBenchmark = {
  enabled: false,
  name: 'ETF World (es. SWDA)',
  ter: 0.20,
  expectedReturn: 7.0,
  capital: 0,
  horizon: 0,
  contribution: 0,
  contributionFreq: 'none',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

let counter = 0
const uid = () => `inst-${++counter}`

const FREQ_OPTIONS: { value: ContributionFreq; label: string }[] = [
  { value: 'none', label: 'Nessun contributo' },
  { value: 'mensile', label: 'Mensile' },
  { value: 'bimestrale', label: 'Bimestrale' },
  { value: 'trimestrale', label: 'Trimestrale' },
  { value: 'semestrale', label: 'Semestrale' },
  { value: 'annuale', label: 'Annuale' },
]

const TYPE_OPTIONS: { value: InstrumentType; label: string }[] = [
  { value: 'fondo_attivo', label: 'Fondo Comune Attivo' },
  { value: 'polizza_ramo1', label: 'Polizza Assicurativa Ramo I' },
  { value: 'polizza_ramo3', label: 'Polizza Assicurativa Ramo III' },
  { value: 'fondo_pensione', label: 'Fondo Pensione' },
  { value: 'etf', label: 'ETF' },
  { value: 'index_fund', label: 'Index Fund' },
]

const ALLOC_FIELDS: { key: keyof AssetAllocation; label: string }[] = [
  { key: 'monetario', label: 'Monetario' },
  { key: 'obbligazionario', label: 'Obbligazionario' },
  { key: 'azionario_eu', label: 'Azionario Europa' },
  { key: 'azionario_us', label: 'Azionario USA' },
  { key: 'azionario_em', label: 'Mercati Emergenti' },
  { key: 'immobiliare', label: 'Immobiliare / REIT' },
  { key: 'altro', label: 'Altro' },
]

function numInput(val: number, onChange: (v: number) => void, opts?: { step?: number; min?: number; max?: number; suffix?: string }) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type="number"
        value={val}
        step={opts?.step ?? 0.01}
        min={opts?.min ?? 0}
        max={opts?.max}
        onChange={e => onChange(parseFloat(e.target.value) || 0)}
        className="input mono"
        style={{ paddingRight: opts?.suffix ? 32 : undefined }}
      />
      {opts?.suffix && (
        <span style={{ position: 'absolute', right: 12, color: 'var(--text-3)', fontSize: '0.8rem', pointerEvents: 'none' }}>
          {opts.suffix}
        </span>
      )}
    </div>
  )
}

function Tooltip2({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <Info
        size={13} style={{ color: 'var(--text-3)', cursor: 'pointer', flexShrink: 0 }}
        onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}
      />
      {open && (
        <span style={{
          position: 'absolute', bottom: '120%', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--surface-2)', border: '1px solid var(--border-2)',
          borderRadius: 8, padding: '6px 10px', width: 220,
          fontSize: '0.75rem', color: 'var(--text-2)', zIndex: 50, lineHeight: 1.4,
          boxShadow: 'var(--shadow)',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

function allocTotal(a: AssetAllocation) {
  return Object.values(a).reduce((s, v) => s + v, 0)
}

// ─── Annual cost approximation ────────────────────────────────────────────────

function annualCostApprox(r: SimResult): number {
  // Reale: costo medio annuo derivato dalla simulazione completa (include contributi e compounding)
  // = totalCostDragWithContrib / horizon (media semplice per visualizzazione)
  return r.totalCostDragWithContrib / r.instrument.horizon
}

// ─── Instrument Card ──────────────────────────────────────────────────────────

function InstrumentCard({
  inst, index, onChange, onRemove,
}: {
  inst: InstrumentInput
  index: number
  onChange: (inst: InstrumentInput) => void
  onRemove: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [costsOpen, setCostsOpen] = useState(false)
  const [allocOpen, setAllocOpen] = useState(false)
  const [kidOpen, setKidOpen] = useState(false)
  const [kidText, setKidText] = useState('')
  const [kidError, setKidError] = useState('')

  const upd = useCallback((patch: Partial<InstrumentInput>) => onChange({ ...inst, ...patch }), [inst, onChange])
  const updCosts = useCallback((patch: Partial<typeof inst.costs>) => upd({ costs: { ...inst.costs, ...patch } }), [inst, upd])
  const updAlloc = useCallback((patch: Partial<AssetAllocation>) => upd({ allocation: { ...inst.allocation, ...patch } }), [inst, upd])

  const total = allocTotal(inst.allocation)
  const totalOk = Math.abs(total - 100) < 0.1 || total === 0

  function applyKid() {
    const parsed = parseKidAllocation(kidText)
    if (!Object.keys(parsed).length) {
      setKidError('Nessuna percentuale trovata. Incolla il testo completo del KID.')
      return
    }
    updAlloc({ ...EMPTY_ALLOCATION, ...parsed })
    setKidOpen(false)
    setKidText('')
    setKidError('')
    setAllocOpen(true)
  }

  // Annual cost preview
  const annualTer = inst.initialCapital * (inst.costs.ter + inst.costs.other) / 100

  return (
    <div className="card" style={{ borderLeft: `3px solid ${inst.color}`, borderRadius: 16, overflow: 'hidden' }}>
      {/* Card header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px',
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setExpanded(e => !e)}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: inst.color + '22', border: `1px solid ${inst.color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', fontWeight: 700, color: inst.color,
        }}>
          {index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {inst.name || `Strumento ${index + 1}`}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <span>{INSTRUMENT_LABELS[inst.type]}</span>
            <span>·</span>
            <span>TER {fmtPct(inst.costs.ter)}</span>
            <span>·</span>
            <span>{inst.horizon}a</span>
            {annualTer > 0 && (
              <>
                <span>·</span>
                <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                  ~{fmtEur(annualTer)}/anno di commissioni
                </span>
              </>
            )}
          </div>
        </div>
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{ padding: '4px 6px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}
          title="Rimuovi"
        >
          <Trash2 size={14} />
        </button>
        {expanded ? <ChevronUp size={16} color="var(--text-3)" /> : <ChevronDown size={16} color="var(--text-3)" />}
      </div>

      {expanded && (
        <div style={{ padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Basic info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Nome strumento</div>
              <input className="input" value={inst.name} placeholder="es. Fondo Azionario X"
                onChange={e => upd({ name: e.target.value })} />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>ISIN</div>
              <input className="input mono" value={inst.isin} placeholder="IT0000000000"
                onChange={e => upd({ isin: e.target.value.toUpperCase() })} />
            </div>
          </div>

          {/* Type */}
          <div>
            <div className="label" style={{ marginBottom: 5 }}>Tipo di strumento</div>
            <select className="input" value={inst.type}
              onChange={e => upd({ type: e.target.value as InstrumentType })}>
              {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* ── Capitale + Contributi unificati ── */}
          <div style={{
            background: 'var(--surface-2)', borderRadius: 12, padding: '14px',
            border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-2)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={13} color="var(--accent)" /> Capitale versato & contributi
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Capitale iniziale</div>
                {numInput(inst.initialCapital, v => upd({ initialCapital: v }), { step: 1000, min: 0, suffix: '€' })}
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Versamento periodico</div>
                {numInput(inst.contribution, v => {
                  const patch: Partial<InstrumentInput> = { contribution: v }
                  if (v > 0 && inst.contributionFreq === 'none') patch.contributionFreq = 'mensile'
                  if (v === 0) patch.contributionFreq = 'none'
                  upd(patch)
                }, { step: 50, min: 0, suffix: '€' })}
              </div>
              <div>
                <div className="label" style={{ marginBottom: 5 }}>Frequenza</div>
                <select className="input" value={inst.contributionFreq}
                  onChange={e => upd({ contributionFreq: e.target.value as ContributionFreq })}>
                  {FREQ_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Orizzonte + Rendimento */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Orizzonte (anni)</div>
              {numInput(inst.horizon, v => upd({ horizon: Math.max(1, Math.round(v)) }), { step: 1, min: 1, max: 50, suffix: 'a' })}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5, display: 'flex', gap: 4 }}>
                Rendimento atteso lordo
                <Tooltip2 text="Rendimento medio annuo lordo (prima dei costi). Consulta il KID o lo storico dell'indice di riferimento." />
              </div>
              {numInput(inst.expectedReturn, v => upd({ expectedReturn: v }), { step: 0.1, min: -20, max: 50, suffix: '%' })}
            </div>
          </div>

          {/* Costs section */}
          <div className="card-sm" style={{ overflow: 'hidden' }}>
            <button
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--text-1)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8125rem',
              }}
              onClick={() => setCostsOpen(o => !o)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingDown size={14} color="var(--red)" /> Struttura dei costi
                <span className="badge badge-down" style={{ fontSize: '0.68rem' }}>
                  totale {fmtPct(inst.costs.entry / inst.horizon + inst.costs.ter + inst.costs.other + inst.costs.exit / inst.horizon)}/a
                </span>
              </span>
              {costsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {costsOpen && (
              <div style={{ padding: '0 14px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { key: 'entry', label: 'Costo ingresso', tip: 'Commissione una-tantum pagata al momento dell\'investimento.' },
                  { key: 'exit', label: 'Costo uscita', tip: 'Commissione pagata al disinvestimento. Può decrescere col tempo.' },
                  { key: 'ter', label: 'TER / Gestione annua', tip: 'Total Expense Ratio: costo annuo ricorrente del fondo/ETF.' },
                  { key: 'performance', label: 'Commissione performance', tip: 'Percentuale dei guadagni prelevata dal gestore (se positivi).' },
                  { key: 'other', label: 'Altri costi annui', tip: 'Spese di distribuzione, wrap fee, costi di custodia aggiuntivi, ecc.' },
                ].map(f => (
                  <div key={f.key}>
                    <div className="label" style={{ marginBottom: 5, display: 'flex', gap: 4 }}>
                      {f.label} <Tooltip2 text={f.tip} />
                    </div>
                    {numInput(
                      inst.costs[f.key as keyof typeof inst.costs],
                      v => updCosts({ [f.key]: v }),
                      { step: 0.01, min: 0, max: 100, suffix: '%' }
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Asset Allocation */}
          <div className="card-sm" style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px' }}>
              <button
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--text-1)', fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8125rem',
                }}
                onClick={() => setAllocOpen(o => !o)}
              >
                <PieIcon size={14} color="var(--accent)" />
                Asset Allocation
                {!totalOk && total > 0 && (
                  <span style={{ color: 'var(--red)', fontSize: '0.75rem' }}>⚠ {total.toFixed(0)}%</span>
                )}
                {totalOk && total > 0 && (
                  <span style={{ color: 'var(--green)', fontSize: '0.75rem' }}>✓</span>
                )}
                {allocOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: '0.72rem', padding: '4px 10px', gap: 5 }}
                onClick={() => setKidOpen(o => !o)}
              >
                <Sparkles size={12} /> Stima da KID
              </button>
            </div>

            {kidOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                <div className="label" style={{ marginBottom: 5 }}>Incolla il testo del KID (sezione Composizione / Asset Allocation)</div>
                <textarea
                  className="input"
                  rows={4}
                  value={kidText}
                  onChange={e => setKidText(e.target.value)}
                  placeholder={'es. "Azionario Europa 45% – Obbligazionario 35% – Monetario 20%"'}
                  style={{ resize: 'vertical', width: '100%' }}
                />
                {kidError && <p style={{ color: 'var(--red)', fontSize: '0.75rem', marginTop: 4 }}>{kidError}</p>}
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-primary" style={{ fontSize: '0.8rem' }} onClick={applyKid}>Estrai allocazione</button>
                  <button className="btn btn-ghost" style={{ fontSize: '0.8rem' }} onClick={() => { setKidOpen(false); setKidText(''); setKidError('') }}>Annulla</button>
                </div>
              </div>
            )}

            {allocOpen && (
              <div style={{ padding: '0 14px 14px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {ALLOC_FIELDS.map(f => (
                    <div key={f.key}>
                      <div className="label" style={{ marginBottom: 4 }}>{f.label}</div>
                      {numInput(inst.allocation[f.key], v => updAlloc({ [f.key]: v }), { step: 0.5, min: 0, max: 100, suffix: '%' })}
                    </div>
                  ))}
                </div>
                <div style={{
                  marginTop: 10, padding: '8px 12px', borderRadius: 10,
                  background: totalOk ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
                  border: `1px solid ${totalOk ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                  fontSize: '0.78rem', color: totalOk ? 'var(--green)' : 'var(--red)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  {totalOk
                    ? '✓ Allocazione corretta (100%)'
                    : `⚠ Totale: ${total.toFixed(1)}% — deve essere 100% o 0%`}
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  )
}

// Missing Sparkles import shim
function Sparkles({ size }: { size: number }) {
  return <span style={{ fontSize: size }}>✨</span>
}

// ─── ETF Benchmark Panel ──────────────────────────────────────────────────────

function EtfBenchmarkPanel({ value, onChange }: {
  value: EtfBenchmark
  onChange: (v: EtfBenchmark) => void
}) {
  const upd = (patch: Partial<EtfBenchmark>) => onChange({ ...value, ...patch })

  return (
    <div className="card" style={{
      marginBottom: 20,
      borderLeft: `3px solid ${value.enabled ? 'var(--green)' : 'var(--border)'}`,
      borderRadius: 16, overflow: 'hidden',
      transition: 'border-color 0.2s',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
        cursor: 'pointer',
      }} onClick={() => upd({ enabled: !value.enabled })}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: value.enabled ? 'rgba(34,197,94,0.12)' : 'var(--surface-2)',
          border: `1px solid ${value.enabled ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}>
          <Zap size={16} color={value.enabled ? 'var(--green)' : 'var(--text-3)'} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-1)' }}>
            Confronta tutti i fondi con un ETF
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', marginTop: 2 }}>
            Imposta i parametri ETF una volta — verrà confrontato automaticamente con tutti i fondi inseriti
          </div>
        </div>
        {/* Toggle */}
        <div style={{
          width: 44, height: 24, borderRadius: 12,
          background: value.enabled ? 'var(--green)' : 'var(--surface-2)',
          border: `1px solid ${value.enabled ? 'var(--green)' : 'var(--border)'}`,
          position: 'relative', transition: 'all 0.2s', flexShrink: 0,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 9, background: 'white',
            position: 'absolute', top: 2,
            left: value.enabled ? 22 : 2,
            transition: 'left 0.2s',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
          }} />
        </div>
      </div>

      {value.enabled && (
        <div style={{ padding: '0 20px 20px' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12,
            background: 'var(--surface-2)', borderRadius: 12, padding: 16,
            border: '1px solid var(--border)',
          }}>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Nome ETF</div>
              <input className="input" value={value.name}
                onChange={e => upd({ name: e.target.value })}
                placeholder="es. SWDA" />
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>
                TER annuo <Tooltip2 text="Costo annuo dell'ETF. I migliori ETF world costano 0.10–0.25%/anno." />
              </div>
              {numInput(value.ter, v => upd({ ter: v }), { step: 0.01, min: 0, max: 5, suffix: '%' })}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>
                Rendimento atteso lordo <Tooltip2 text="Rendimento storico medio degli indici azionari mondiali: ~7-8%/anno." />
              </div>
              {numInput(value.expectedReturn, v => upd({ expectedReturn: v }), { step: 0.1, min: -20, max: 50, suffix: '%' })}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>
                Capitale (0 = usa primo fondo)
              </div>
              {numInput(value.capital, v => upd({ capital: v }), { step: 1000, min: 0, suffix: '€' })}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>
                Orizzonte (0 = usa primo fondo)
              </div>
              {numInput(value.horizon, v => upd({ horizon: Math.max(0, Math.round(v)) }), { step: 1, min: 0, max: 50, suffix: 'a' })}
            </div>
            <div>
              <div className="label" style={{ marginBottom: 5 }}>Versamento periodico</div>
              {numInput(value.contribution, v => upd({ contribution: v }), { step: 50, min: 0, suffix: '€' })}
            </div>
          </div>
          <div style={{
            marginTop: 10, padding: '8px 14px', borderRadius: 10,
            background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
            fontSize: '0.78rem', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <Check size={12} /> L'ETF verrà aggiunto automaticamente ai risultati e ai grafici
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Burning Money Section ────────────────────────────────────────────────────

function BurningMoneySection({ results, etfEnabled, etfTer, etfReturn }: {
  results: SimResult[]
  etfEnabled: boolean
  etfTer: number
  etfReturn: number
}) {
  // Only show for non-ETF instruments
  const costlyInsts = results.filter(r =>
    r.instrument.type !== 'etf' && r.instrument.type !== 'index_fund'
  )
  if (!costlyInsts.length) return null

  const totalAnnualBurn = costlyInsts.reduce((s, r) => s + annualCostApprox(r), 0)

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(239,68,68,0.07) 0%, rgba(251,146,60,0.05) 100%)',
      border: '1px solid rgba(239,68,68,0.2)',
      borderRadius: 20, padding: '24px 28px', marginBottom: 24,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, flexShrink: 0,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Flame size={20} color="var(--red)" />
        </div>
        <div>
          <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-1)' }}>
            Costi che bruciano il tuo patrimonio
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-3)', marginTop: 2 }}>
            Commissioni di gestione pagate ogni anno, indipendentemente dai rendimenti
          </div>
        </div>
        {/* Total burn badge */}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Totale annuo
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--red)' }}>
            {fmtEur(totalAnnualBurn)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
            {fmtEur(totalAnnualBurn / 12)}/mese
          </div>
        </div>
      </div>

      {/* Per-instrument cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
        {costlyInsts.map(r => {
          const annualCost = annualCostApprox(r)
          const totalCost = r.totalCostDragWithContrib  // costo reale: include contributi + effetto compounding

          // ETF alternative (same capital, horizon, contribution)
          const etfAlt = etfEnabled ? simulate({
            ...r.instrument,
            id: `etf-alt-${r.instrument.id}`,
            name: 'ETF alternativo',
            type: 'etf',
            color: '#22C55E',
            expectedReturn: etfReturn,
            costs: { entry: 0, exit: 0, ter: etfTer, performance: 0, other: 0 },
          }) : null

          const etfAnnualCost = etfAlt ? annualCostApprox(etfAlt) : 0
          const annualSaving = etfAlt ? annualCost - etfAnnualCost : 0
          const totalSaving = etfAlt
            ? (r.instrument.contributionFreq !== 'none' ? etfAlt.finalValueWithContrib - r.finalValueWithContrib : etfAlt.finalValueNoContrib - r.finalValueNoContrib)
            : 0

          return (
            <div key={r.instrument.id} style={{
              background: 'var(--surface)', borderRadius: 14, padding: '16px 18px',
              borderLeft: `3px solid ${r.instrument.color}`,
              border: `1px solid var(--border)`,
            }}>
              {/* Instrument name */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: r.instrument.color, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-1)' }}>
                  {r.instrument.name || 'Strumento'}
                </span>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-3)' }}>
                  TER {fmtPct(r.instrument.costs.ter + r.instrument.costs.other)}
                </span>
              </div>

              {/* Cost numbers */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
                <div style={{
                  background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(239,68,68,0.12)',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 3 }}>
                    OGNI MESE
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--red)' }}>
                    {fmtEur(annualCost / 12)}
                  </div>
                </div>
                <div style={{
                  background: 'rgba(239,68,68,0.06)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(239,68,68,0.12)',
                }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.03em', marginBottom: 3 }}>
                    OGNI ANNO
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--red)' }}>
                    {fmtEur(annualCost)}
                  </div>
                </div>
              </div>

              {/* Total cost bar */}
              <div style={{ marginBottom: etfAlt ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                    Costi totali in {r.instrument.horizon} anni
                  </span>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--red)' }}>
                    {fmtEur(totalCost)}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: 'var(--red)',
                    width: totalCost > 0 ? `${Math.min(100, (totalCost / (r.totalInvested || 1)) * 100)}%` : '0%',
                    borderRadius: 3, transition: 'width 0.5s',
                  }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', marginTop: 3 }}>
                  {r.totalInvested > 0
                    ? `${((totalCost / r.totalInvested) * 100).toFixed(1)}% del capitale versato eroso dalle commissioni`
                    : ''}
                </div>
              </div>

              {/* ETF comparison */}
              {etfAlt && (
                <div style={{
                  background: 'rgba(34,197,94,0.06)', borderRadius: 10, padding: '10px 12px',
                  border: '1px solid rgba(34,197,94,0.15)',
                }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--green)', fontWeight: 600, marginBottom: 4 }}>
                    ⚡ Con un ETF in alternativa
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Risparmio/anno</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green)' }}>
                        +{fmtEur(annualSaving)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Patrimonio extra</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green)' }}>
                        +{fmtEur(Math.max(0, totalSaving))}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-3)' }}>Mese in più</div>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--green)' }}>
                        +{fmtEur(Math.max(0, totalSaving) / 12 / r.instrument.horizon)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Custom tooltip for recharts ──────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!(active as boolean) || !(payload as unknown[])?.length) return null
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-2)',
      borderRadius: 10, padding: '10px 14px', boxShadow: 'var(--shadow)',
      fontSize: '0.8rem',
    }}>
      <div style={{ color: 'var(--text-2)', marginBottom: 6 }}>{label as string}</div>
      {(payload as { color: string; name: string; value: number }[]).map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: p.color, flexShrink: 0 }} />
          <span style={{ color: 'var(--text-2)' }}>{p.name}:</span>
          <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{fmtEur(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Confronto() {
  const [instruments, setInstruments] = useState<InstrumentInput[]>([
    DEFAULT_INSTRUMENT(uid(), 0),
    DEFAULT_INSTRUMENT(uid(), 1),
  ])
  const [etfBenchmark, setEtfBenchmark] = useState<EtfBenchmark>(DEFAULT_ETF_BENCHMARK)
  const [activeChart, setActiveChart] = useState<'patrimonio' | 'costi' | 'allocazione'>('patrimonio')
  const [clientName, setClientName] = useState('')
  const [withContrib, setWithContrib] = useState(true)

  // ── Load from localStorage ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cheetf-confronto')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length) setInstruments(parsed)
      }
      const savedEtf = localStorage.getItem('cheetf-etf-benchmark')
      if (savedEtf) setEtfBenchmark(JSON.parse(savedEtf))
    } catch { /* ignore */ }
  }, [])

  // ── Save to localStorage ──
  useEffect(() => {
    try { localStorage.setItem('cheetf-confronto', JSON.stringify(instruments)) } catch { /* ignore */ }
  }, [instruments])

  useEffect(() => {
    try { localStorage.setItem('cheetf-etf-benchmark', JSON.stringify(etfBenchmark)) } catch { /* ignore */ }
  }, [etfBenchmark])

  // ── Mutations ──
  function addInstrument() {
    if (instruments.length >= 8) return
    setInstruments(prev => [...prev, DEFAULT_INSTRUMENT(uid(), prev.length)])
  }

  function removeInstrument(id: string) {
    setInstruments(prev => prev.filter(i => i.id !== id))
  }

  function updateInstrument(updated: InstrumentInput) {
    setInstruments(prev => prev.map(i => i.id === updated.id ? updated : i))
  }

  // ── Auto-computed results (no manual button needed) ──
  const results = useMemo<SimResult[] | null>(() => {
    const valid = instruments.filter(i => i.name || i.initialCapital > 0)
    if (!valid.length) return null

    const baseResults = valid.map(i => simulate(i))

    // Add ETF benchmark as an additional instrument in comparison
    if (etfBenchmark.enabled) {
      const refInst = valid[0]
      const etfInst: InstrumentInput = {
        id: 'etf-benchmark',
        name: etfBenchmark.name || 'ETF Benchmark',
        isin: '',
        type: 'etf' as InstrumentType,
        color: '#22C55E',
        initialCapital: etfBenchmark.capital || refInst.initialCapital,
        horizon: etfBenchmark.horizon || refInst.horizon,
        expectedReturn: etfBenchmark.expectedReturn,
        contribution: etfBenchmark.contribution || refInst.contribution,
        contributionFreq: etfBenchmark.contributionFreq !== 'none'
          ? etfBenchmark.contributionFreq
          : refInst.contributionFreq,
        costs: { entry: 0, exit: 0, ter: etfBenchmark.ter, performance: 0, other: 0 },
        allocation: EMPTY_ALLOCATION,
      }
      return [...baseResults, simulate(etfInst)]
    }

    return baseResults
  }, [instruments, etfBenchmark])

  // ── Derived ──
  const chartData = useMemo(() => results ? buildChartData(results, withContrib) : [], [results, withContrib])
  const costBreakdown = useMemo(() => results ? buildCostBreakdown(results) : [], [results])
  const allocData = useMemo(() => results ? buildAggregatedAllocation(results) : [], [results])

  const finalVal = (r: SimResult) => withContrib ? r.finalValueWithContrib : r.finalValueNoContrib

  const best  = results ? [...results].sort((a, b) => finalVal(b) - finalVal(a))[0] : null
  const worst = results && results.length > 1 ? [...results].sort((a, b) => finalVal(a) - finalVal(b))[0] : null
  const opportunityCost = best && worst ? finalVal(best) - finalVal(worst) : 0
  const highCostInst = results ? [...results].sort((a, b) => b.totalCostDragWithContrib - a.totalCostDragWithContrib)[0] : null

  // Total invested (capital + cumulative contributions) for display
  const totalInvested = (r: SimResult) => {
    const { initialCapital, contribution, contributionFreq, horizon } = r.instrument
    const FREQ_PER_YEAR: Record<ContributionFreq, number> = {
      none: 0, mensile: 12, bimestrale: 6, trimestrale: 4, semestrale: 2, annuale: 1
    }
    const freq = FREQ_PER_YEAR[contributionFreq] ?? 0
    return initialCapital + contribution * freq * horizon
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36, textAlign: 'center' }}>
        <div className="badge badge-blue" style={{ marginBottom: 16, fontSize: '0.75rem' }}>
          <Scale size={11} /> Confronto Reale
        </div>
        <h1 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 14 }}>
          Fondi, Polizze e Pensioni<br />
          <span style={{ color: 'var(--accent)' }}>vs ETF</span>
        </h1>
        <p style={{ color: 'var(--text-2)', maxWidth: 560, margin: '0 auto', lineHeight: 1.65, fontSize: '1rem' }}>
          Calcola l'impatto reale di commissioni, costi di gestione e struttura dei costi sul tuo patrimonio.
          I risultati si aggiornano in tempo reale mentre inserisci i dati.
        </p>
      </div>

      {/* ── ETF Benchmark Panel ───────────────────────────────────────────────── */}
      <EtfBenchmarkPanel value={etfBenchmark} onChange={setEtfBenchmark} />

      {/* ── Instruments ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {instruments.map((inst, idx) => (
          <InstrumentCard
            key={inst.id}
            inst={inst}
            index={idx}
            onChange={updateInstrument}
            onRemove={() => removeInstrument(inst.id)}
          />
        ))}
      </div>

      {/* Add bar */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 40 }}>
        {instruments.length < 8 && (
          <button className="btn btn-ghost" onClick={addInstrument} style={{ gap: 6 }}>
            <Plus size={14} /> Aggiungi strumento
            <span style={{ color: 'var(--text-3)', fontSize: '0.75rem' }}>({instruments.length}/8)</span>
          </button>
        )}
        {/* Live indicator */}
        {results && (
          <div style={{
            marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
            fontSize: '0.78rem', color: 'var(--green)',
          }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%', background: 'var(--green)',
              animation: 'pulse 2s infinite',
            }} />
            Aggiornato in tempo reale
          </div>
        )}
      </div>

      {/* ── Results (auto-computed) ───────────────────────────────────────────── */}
      {results && (
        <div>
          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Risultati</h2>
              <p style={{ color: 'var(--text-2)', fontSize: '0.85rem', marginTop: 2 }}>
                Capitale + contributi versati, al netto di tutti i costi
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div className="tab-group">
                <button className={`tab ${!withContrib ? 'active' : ''}`} onClick={() => setWithContrib(false)}>Solo capitale</button>
                <button className={`tab ${withContrib ? 'active' : ''}`} onClick={() => setWithContrib(true)}>Capitale + contributi</button>
              </div>
              <input
                className="input"
                placeholder="Nome cliente (opz.)"
                value={clientName}
                onChange={e => setClientName(e.target.value)}
                style={{ width: 180 }}
              />
              <PdfDownloadButton results={results} withContrib={withContrib} clientName={clientName} />
            </div>
          </div>

          {/* ── KPI Cards ────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
            <div className="card-sm" style={{ padding: '16px 18px', borderLeft: `3px solid var(--green)` }}>
              <div className="label" style={{ marginBottom: 6 }}>Miglior risultato netto</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--green)' }}>
                {fmtEur(finalVal(best!))}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                {best!.instrument.name || 'Strumento'}
              </div>
            </div>

            {results.length > 1 && (
              <div className="card-sm" style={{ padding: '16px 18px', borderLeft: `3px solid var(--red)` }}>
                <div className="label" style={{ marginBottom: 6 }}>Peggior risultato netto</div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--red)' }}>
                  {fmtEur(finalVal(worst!))}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {worst!.instrument.name || 'Strumento'}
                </div>
              </div>
            )}

            {results.length > 1 && (
              <div className="card-sm" style={{ padding: '16px 18px', borderLeft: `3px solid var(--accent)` }}>
                <div className="label" style={{ marginBottom: 6, display: 'flex', gap: 4 }}>
                  Differenza miglior vs peggior
                  <Tooltip2 text="Patrimonio aggiuntivo accumulando nello strumento più efficiente." />
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {fmtEur(opportunityCost)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                  costo opportunità totale
                </div>
              </div>
            )}

            {highCostInst && (
              <div className="card-sm" style={{ padding: '16px 18px', borderLeft: `3px solid var(--red)` }}>
                <div className="label" style={{ marginBottom: 6 }}>
                  Commissioni totali più alte <Tooltip2 text="Denaro eroso dai costi nei confronti della crescita lorda." />
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--red)' }}>
                  {fmtEur(highCostInst.totalCostDragWithContrib)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-3)', marginTop: 4 }}>
                  {highCostInst.instrument.name || 'Strumento'}
                </div>
              </div>
            )}
          </div>

          {/* ── 🔥 Burning Money Section ─────────────────────────────────────── */}
          <BurningMoneySection
            results={results}
            etfEnabled={etfBenchmark.enabled}
            etfTer={etfBenchmark.ter}
            etfReturn={etfBenchmark.expectedReturn}
          />

          {/* ── "What you're losing" alert ────────────────────────────────────── */}
          {results.length > 1 && opportunityCost > 500 && (
            <div style={{
              background: 'linear-gradient(135deg, rgba(248,113,113,0.08) 0%, rgba(251,146,60,0.06) 100%)',
              border: '1px solid rgba(248,113,113,0.25)',
              borderRadius: 16, padding: '22px 26px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <AlertTriangle size={22} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 8 }}>
                    Quanto stai perdendo scegliendo {worst!.instrument.name || 'lo strumento più costoso'}?
                  </div>
                  <p style={{ color: 'var(--text-2)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                    In <strong style={{ color: 'var(--text-1)' }}>{worst!.instrument.horizon} anni</strong>, i costi di{' '}
                    <strong style={{ color: 'var(--text-1)' }}>{worst!.instrument.name || 'questo strumento'}</strong> erodono{' '}
                    <strong style={{ color: 'var(--red)' }}>{fmtEur(worst!.totalCostDragWithContrib)}</strong> del tuo patrimonio lordo (inclusi contributi).{' '}
                    Rispetto a <strong style={{ color: 'var(--text-1)' }}>{best!.instrument.name}</strong>,
                    stai rinunciando a{' '}
                    <strong style={{ color: 'var(--red)', fontSize: '1.05rem' }}>{fmtEur(opportunityCost)}</strong> di patrimonio finale.
                  </p>
                  <div style={{ marginTop: 14, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                    <div>
                      <div className="label" style={{ marginBottom: 3 }}>Stai pagando in più ogni anno</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)' }}>
                        {fmtEur(opportunityCost / worst!.instrument.horizon)}
                      </div>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 3 }}>Ogni mese</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--red)' }}>
                        {fmtEur(opportunityCost / worst!.instrument.horizon / 12)}
                      </div>
                    </div>
                    <div>
                      <div className="label" style={{ marginBottom: 3 }}>Differenza CAGR netto</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>
                        {fmtPct((best!.cagrNet - worst!.cagrNet) * 100)} / anno
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Chart tabs ─────────────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div className="tab-group">
                {([['patrimonio', 'Patrimonio nel tempo'], ['costi', 'Breakdown costi'], ['allocazione', 'Asset allocation']] as const).map(([k, l]) => (
                  <button key={k} className={`tab ${activeChart === k ? 'active' : ''}`} onClick={() => setActiveChart(k)}>{l}</button>
                ))}
              </div>
            </div>

            {activeChart === 'patrimonio' && (
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={chartData} margin={{ top: 4, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-2)', paddingTop: 8 }} />
                  {results.map(r => (
                    <Line
                      key={r.instrument.id}
                      dataKey={r.instrument.id}
                      name={r.instrument.name || 'Strumento'}
                      stroke={r.instrument.color}
                      strokeWidth={r.instrument.id === 'etf-benchmark' ? 3 : 2}
                      strokeDasharray={r.instrument.id === 'etf-benchmark' ? '6 3' : undefined}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'costi' && (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={costBreakdown} margin={{ top: 4, right: 10, bottom: 0, left: 10 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tickFormatter={v => `€${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: 'var(--text-2)', fontSize: 11 }} width={120} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '0.78rem', color: 'var(--text-2)', paddingTop: 8 }} />
                  <Bar dataKey="entryTotal" name="Ingresso" stackId="a" fill="var(--red)" opacity={0.6} />
                  <Bar dataKey="annualTotal" name="Gestione annua" stackId="a" fill="#F87171" opacity={0.85} />
                  <Bar dataKey="perfFeeTotal" name="Performance fee" stackId="a" fill="#FCA5A5" />
                  <Bar dataKey="exitTotal" name="Uscita" stackId="a" fill="#FEE2E2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {activeChart === 'allocazione' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap' }}>
                <ResponsiveContainer width={280} height={280}>
                  <PieChart>
                    <Pie data={allocData} cx="50%" cy="50%" innerRadius={65} outerRadius={110} paddingAngle={2} dataKey="value">
                      {allocData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v) => `${Number(v ?? 0).toFixed(1)}%`} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {allocData.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>{s.name}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-1)', marginLeft: 'auto', paddingLeft: 16 }}>
                        {s.value.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                  {allocData.length === 0 && (
                    <p style={{ color: 'var(--text-3)', fontSize: '0.85rem' }}>
                      Inserisci l'asset allocation degli strumenti per visualizzare la composizione aggregata del portafoglio.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Comparison table ──────────────────────────────────────────────── */}
          <div className="card" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
              <Layers size={16} color="var(--accent)" /> Tabella comparativa completa
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                <thead>
                  <tr>
                    {[
                      'Strumento', 'Tipo', 'Cap. + Contributi', 'Orizzonte',
                      'Lordo att.', 'TER totale',
                      'Valore netto finale', 'Costi erosi', 'CAGR netto',
                    ].map(h => (
                      <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-3)', fontWeight: 600, borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, idx) => {
                    const isBest  = r === best
                    const isWorst = results.length > 1 && r === worst
                    const isEtf   = r.instrument.id === 'etf-benchmark'
                    const tv = totalInvested(r)
                    return (
                      <tr key={r.instrument.id} style={{
                        borderBottom: '1px solid var(--border)',
                        background: isEtf ? 'rgba(34,197,94,0.03)' : undefined,
                      }}>
                        <td style={{ padding: '10px 10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: r.instrument.color, flexShrink: 0 }} />
                            <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>
                              {r.instrument.name || `Strumento ${idx + 1}`}
                            </span>
                            {isBest  && <span className="badge badge-up"   style={{ fontSize: '0.65rem' }}>BEST</span>}
                            {isWorst && <span className="badge badge-down" style={{ fontSize: '0.65rem' }}>WORST</span>}
                            {isEtf   && <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>ETF</span>}
                          </div>
                          {r.instrument.isin && <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 2 }}>{r.instrument.isin}</div>}
                        </td>
                        <td style={{ padding: '10px 10px', color: 'var(--text-2)' }}>{INSTRUMENT_LABELS[r.instrument.type]}</td>
                        <td style={{ padding: '10px 10px', fontWeight: 600 }} className="mono">
                          <div>{fmtEur(tv)}</div>
                          {r.instrument.contributionFreq !== 'none' && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)', fontWeight: 400 }}>
                              Cap. {fmtEur(r.instrument.initialCapital)} + {fmtEur(tv - r.instrument.initialCapital)} vers.
                            </div>
                          )}
                        </td>
                        <td style={{ padding: '10px 10px', color: 'var(--text-2)' }}>{r.instrument.horizon} anni</td>
                        <td style={{ padding: '10px 10px' }} className="mono">{fmtPct(r.instrument.expectedReturn)}</td>
                        <td style={{ padding: '10px 10px', color: 'var(--red)' }} className="mono">
                          {fmtPct(r.instrument.costs.ter + r.instrument.costs.other + r.instrument.costs.entry / r.instrument.horizon + r.instrument.costs.exit / r.instrument.horizon)}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 700, color: isBest ? 'var(--green)' : isWorst ? 'var(--red)' : 'var(--text-1)' }} className="mono">
                          {fmtEur(finalVal(r))}
                        </td>
                        <td style={{ padding: '10px 10px', color: 'var(--red)', fontWeight: 600 }} className="mono">
                          {fmtEur(r.totalCostDragWithContrib)}
                        </td>
                        <td style={{ padding: '10px 10px', fontWeight: 600, color: r.cagrNet >= 0 ? 'var(--green)' : 'var(--red)' }} className="mono">
                          {fmtPct(r.cagrNet * 100)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Per-instrument summary ────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12, marginBottom: 20 }}>
            {results.map(r => {
              const tv = totalInvested(r)
              const fv = finalVal(r)
              const isEtf = r.instrument.id === 'etf-benchmark'
              return (
                <div key={r.instrument.id} className="card-sm" style={{
                  padding: '16px 18px', borderLeft: `3px solid ${r.instrument.color}`,
                  background: isEtf ? 'rgba(34,197,94,0.03)' : undefined,
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 7 }}>
                    {r.instrument.name || 'Strumento'}
                    {isEtf && <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>ETF benchmark</span>}
                  </div>
                  {/* Valore finale prominente */}
                  <div style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginBottom: 2 }}>Capitale finale netto</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: r.instrument.color }} className="mono">{fmtEur(fv)}</div>
                    <div style={{ fontSize: '0.72rem', color: fv > tv ? 'var(--green)' : 'var(--red)', marginTop: 2 }}>
                      {fv > tv ? '+' : ''}{fmtEur(fv - tv)} rispetto al versato ({fv > tv ? '+' : ''}{((fv / tv - 1) * 100).toFixed(1)}%)
                    </div>
                  </div>
                  {/* Breakdown versamenti */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Capitale iniziale versato</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }} className="mono">{fmtEur(r.instrument.initialCapital)}</span>
                    </div>
                    {r.instrument.contributionFreq !== 'none' && r.instrument.contribution > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>
                          Contributi ({fmtEur(r.instrument.contribution)} × {r.instrument.horizon} anni)
                        </span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-2)' }} className="mono">{fmtEur(tv - r.instrument.initialCapital)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Totale versato</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-1)' }} className="mono">{fmtEur(tv)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--red)' }}>Commissioni erosse (reale)</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--red)' }} className="mono">{fmtEur(r.totalCostDragWithContrib)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>CAGR netto</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: r.cagrNet >= 0 ? 'var(--green)' : 'var(--red)' }} className="mono">{fmtPct(r.cagrNet * 100)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Disclaimer */}
          <div style={{
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '14px 18px', fontSize: '0.75rem', color: 'var(--text-3)', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'var(--text-2)' }}>⚠ Disclaimer —</strong> Questo strumento ha finalità puramente informativa e didattica.
            I calcoli si basano su rendimenti attesi ipotetici e costi dichiarati dall'utente.
            I rendimenti passati non sono garanzia di quelli futuri. Non costituisce consulenza finanziaria, fiscale o legale.
            Rivolgiti sempre a un consulente finanziario indipendente prima di prendere decisioni d'investimento.
            CheETF non è responsabile per eventuali perdite derivanti dall'utilizzo di questi dati.
          </div>
        </div>
      )}
    </div>
  )
}
