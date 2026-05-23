'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, ArrowUpRight, X, ChevronUp, ChevronDown, BarChart2, GitCompare, CheckCircle2, ShoppingCart } from 'lucide-react'
import { ETF_CATALOG, ALL_CATEGORIES, SUB_CATEGORIES, type ETFEntry } from '@/lib/etf-catalog'
import { getEtfDescription } from '@/lib/etf-descriptions'

function fmtAum(aum: number | null): string {
  if (aum === null) return '—'
  if (aum < 1000) return `€${aum}m`
  if (aum < 10000) return `€${(aum / 1000).toFixed(1).replace('.', ',')}b`
  return `€${Math.round(aum / 1000)}b`
}

const TER_OPTIONS = [
  { label: 'Tutti', value: null },
  { label: '≤ 0,10%', value: 0.10 },
  { label: '≤ 0,20%', value: 0.20 },
  { label: '≤ 0,50%', value: 0.50 },
]

type SortKey = 'none' | 'name' | 'ter' | 'aum'
type SortDir = 'asc' | 'desc'

function distType(name: string): 'Acc' | 'Dist' | null {
  const n = name.toLowerCase()
  if (n.includes('(acc)')) return 'Acc'
  if (n.includes('(dist)')) return 'Dist'
  return null
}

const DISABLED_TABS = new Set(['Monetari', 'Leva'])
const EXTRA_CATS = ['Monetari', 'Leva']

// ─── Cart banner ──────────────────────────────────────────────────────────────

function CartBanner({
  backtestCart, comparatorCart,
  onRemoveBt, onRemoveCmp,
  onProceedBt, onProceedCmp,
  onClear,
}: {
  backtestCart: ETFEntry[]
  comparatorCart: ETFEntry[]
  onRemoveBt: (t: string) => void
  onRemoveCmp: (t: string) => void
  onProceedBt: () => void
  onProceedCmp: () => void
  onClear: () => void
}) {
  const hasBt  = backtestCart.length > 0
  const hasCmp = comparatorCart.length > 0

  return (
    <div style={{
      position: 'sticky', top: 60, zIndex: 90,
      background: 'var(--surface)',
      backdropFilter: 'blur(20px) saturate(180%)',
      borderBottom: '1px solid var(--border)',
      padding: '10px 0',
      marginBottom: 24,
      marginLeft: -28, marginRight: -28,   // break out of parent padding
      paddingLeft: 28, paddingRight: 28,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
        {/* Icon + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: hasBt && hasCmp ? 4 : 0, flexShrink: 0 }}>
          <ShoppingCart size={16} color="var(--accent)" />
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
            La tua selezione
          </span>
        </div>

        {/* Cart rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {hasBt && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <BarChart2 size={13} color="var(--accent)" />
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent)' }}>Backtest</span>
              </div>
              {backtestCart.map(e => (
                <div key={e.ticker} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', borderRadius: 20, background: 'rgba(var(--accent-rgb,56,189,248),0.12)', border: '1px solid rgba(var(--accent-rgb,56,189,248),0.3)', fontSize: '0.73rem', fontWeight: 700, color: 'var(--accent)' }}>
                  {e.ticker}
                  <button onClick={() => onRemoveBt(e.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', display: 'flex', padding: 1, opacity: 0.7 }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>· aggiungi altri dalla lista</span>
            </div>
          )}
          {hasCmp && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <GitCompare size={13} color="#a78bfa" />
                <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#a78bfa' }}>Confronta</span>
              </div>
              {comparatorCart.map(e => (
                <div key={e.ticker} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px 3px 10px', borderRadius: 20, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', fontSize: '0.73rem', fontWeight: 700, color: '#a78bfa' }}>
                  {e.ticker}
                  <button onClick={() => onRemoveCmp(e.ticker)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a78bfa', display: 'flex', padding: 1, opacity: 0.7 }}>
                    <X size={11} />
                  </button>
                </div>
              ))}
              <span style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>· aggiungi altri dalla lista</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {hasBt && (
            <button onClick={onProceedBt} className="btn btn-primary" style={{ padding: '8px 14px', fontSize: '0.78rem', gap: 6 }}>
              <BarChart2 size={13} /> Vai al Backtest
            </button>
          )}
          {hasCmp && (
            <button onClick={onProceedCmp} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, fontSize: '0.78rem', fontWeight: 600, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', cursor: 'pointer' }}>
              <GitCompare size={13} /> Vai al Confronto
            </button>
          )}
          <button onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-3)', display: 'flex' }} title="Svuota selezione">
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Screener ─────────────────────────────────────────────────────────────────

export default function Screener() {
  const router = useRouter()

  // Filters
  const [category, setCategory] = useState('Tutti')
  const [subCategory, setSubCategory] = useState('Tutti')
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('Tutti')
  const [terFilter, setTerFilter] = useState<number | null>(null)
  const [distFilter, setDistFilter] = useState<'Tutti' | 'Acc' | 'Dist'>('Tutti')
  const [sortKey, setSortKey] = useState<SortKey>('aum')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Cart
  const [backtestCart, setBacktestCart] = useState<ETFEntry[]>([])
  const [comparatorCart, setComparatorCart] = useState<ETFEntry[]>([])

  const hasCart = backtestCart.length > 0 || comparatorCart.length > 0

  function toggleBt(etf: ETFEntry) {
    setBacktestCart(prev =>
      prev.find(e => e.ticker === etf.ticker)
        ? prev.filter(e => e.ticker !== etf.ticker)
        : [...prev, etf]
    )
  }

  function toggleCmp(etf: ETFEntry) {
    setComparatorCart(prev =>
      prev.find(e => e.ticker === etf.ticker)
        ? prev.filter(e => e.ticker !== etf.ticker)
        : [...prev, etf]
    )
  }

  function proceedBt() {
    const tickers = backtestCart.map(e => encodeURIComponent(e.ticker)).join(',')
    router.push(`/backtest?tickers=${tickers}`)
  }

  function proceedCmp() {
    const tickers = comparatorCart.map(e => encodeURIComponent(e.ticker)).join(',')
    router.push(`/comparator?tickers=${tickers}`)
  }

  // Sorting
  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  // Category counts
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const e of ETF_CATALOG) c[e.category] = (c[e.category] || 0) + 1
    return c
  }, [])

  const providers = useMemo(() => {
    const set = new Set(ETF_CATALOG.map(e => e.provider).filter(Boolean))
    return ['Tutti', ...Array.from(set).sort()]
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    let list = ETF_CATALOG.filter(e => {
      const matchSearch = !q ||
        e.name.toLowerCase().includes(q) ||
        e.ticker.toLowerCase().includes(q) ||
        e.isin.toLowerCase().includes(q) ||
        e.provider.toLowerCase().includes(q)
      const matchCat = category === 'Tutti' || e.category === category
      const matchSub = subCategory === 'Tutti' || e.subCategory === subCategory
      const matchProvider = providerFilter === 'Tutti' || e.provider === providerFilter
      const matchTer = terFilter === null || e.ter <= terFilter
      const dt = distType(e.name)
      const matchDist = distFilter === 'Tutti' || dt === distFilter
      return matchSearch && matchCat && matchSub && matchProvider && matchTer && matchDist
    })
    if (sortKey !== 'none') {
      list = [...list].sort((a, b) => {
        let cmp = 0
        if (sortKey === 'name') cmp = a.name.localeCompare(b.name, 'it')
        if (sortKey === 'ter') cmp = (a.ter ?? 99) - (b.ter ?? 99)
        if (sortKey === 'aum') cmp = (a.aum ?? -1) - (b.aum ?? -1)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    return list
  }, [search, category, subCategory, providerFilter, terFilter, distFilter, sortKey, sortDir])

  const currentSubCategories = category !== 'Tutti' ? (SUB_CATEGORIES[category] ?? []) : []
  const showSubCats = category !== 'Tutti' && currentSubCategories.length > 1

  const activeFilterCount = [
    category !== 'Tutti', subCategory !== 'Tutti',
    providerFilter !== 'Tutti', terFilter !== null, distFilter !== 'Tutti',
  ].filter(Boolean).length

  function resetFilters() {
    setCategory('Tutti'); setSubCategory('Tutti')
    setProviderFilter('Tutti'); setTerFilter(null)
    setDistFilter('Tutti'); setSearch('')
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={11} style={{ opacity: 0.3, marginLeft: 3 }} />
    return sortDir === 'asc'
      ? <ChevronUp size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
      : <ChevronDown size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
  }

  const allCategories = ['Tutti', ...ALL_CATEGORIES, ...EXTRA_CATS]

  return (
    <div style={{ maxWidth: 1440, margin: '0 auto', padding: '40px 28px' }}>

      {/* Cart banner */}
      {hasCart && (
        <CartBanner
          backtestCart={backtestCart}
          comparatorCart={comparatorCart}
          onRemoveBt={t => setBacktestCart(p => p.filter(e => e.ticker !== t))}
          onRemoveCmp={t => setComparatorCart(p => p.filter(e => e.ticker !== t))}
          onProceedBt={proceedBt}
          onProceedCmp={proceedCmp}
          onClear={() => { setBacktestCart([]); setComparatorCart([]) }}
        />
      )}

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div className="label" style={{ marginBottom: 8 }}>DATABASE ETF</div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.25rem)', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8 }}>
          Screener ETF
        </h1>
        <p style={{ color: 'var(--text-2)', fontSize: '0.9375rem' }}>
          {ETF_CATALOG.length} strumenti disponibili · aggiornati settimanalmente
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 28, alignItems: 'start' }}>

        {/* LEFT: Filters */}
        <div style={{ position: 'sticky', top: hasCart ? 160 : 80, maxHeight: `calc(100vh - ${hasCart ? 170 : 90}px)`, overflowY: 'auto', paddingRight: 4 }}>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* Search */}
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
                <input className="input" style={{ paddingLeft: 34, fontSize: '0.84rem' }}
                  placeholder="Cerca ETF…" value={search}
                  onChange={e => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>

            {/* Categories */}
            <div style={{ padding: '12px 0' }}>
              <div style={{ padding: '0 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="label" style={{ fontSize: '0.68rem' }}>Categoria</div>
                {activeFilterCount > 0 && (
                  <button onClick={resetFilters} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 600, padding: 0 }}>
                    Reset ({activeFilterCount})
                  </button>
                )}
              </div>
              {allCategories.map(cat => {
                const isDisabled = DISABLED_TABS.has(cat)
                const isActive = category === cat
                const count = cat === 'Tutti' ? ETF_CATALOG.length : !isDisabled ? (categoryCounts[cat] ?? null) : null
                return (
                  <button key={cat} disabled={isDisabled} onClick={() => !isDisabled && (setCategory(cat), setSubCategory('Tutti'))}
                    style={{ width: '100%', textAlign: 'left', padding: '8px 16px', background: isActive ? 'rgba(var(--accent-rgb,56,189,248),0.1)' : 'none', border: 'none', cursor: isDisabled ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: isDisabled ? 0.4 : 1, borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent', transition: 'all 0.12s' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--accent)' : 'var(--text-2)' }}>
                      {cat}
                      {isDisabled && <span style={{ marginLeft: 6, fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px', borderRadius: 5, background: 'var(--surface-2)', color: 'var(--text-3)', border: '1px solid var(--border)', verticalAlign: 'middle' }}>Presto</span>}
                    </span>
                    {count != null && <span style={{ fontSize: '0.68rem', color: isActive ? 'var(--accent)' : 'var(--text-3)', fontWeight: 600 }}>{count}</span>}
                  </button>
                )
              })}
            </div>

            {/* Sub-categories */}
            {showSubCats && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0' }}>
                <div className="label" style={{ fontSize: '0.68rem', padding: '0 16px 8px' }}>Sub-categoria</div>
                {(['Tutti', ...currentSubCategories]).map(sub => (
                  <button key={sub} onClick={() => setSubCategory(sub)}
                    style={{ width: '100%', textAlign: 'left', padding: '7px 16px', background: subCategory === sub ? 'rgba(var(--accent-rgb,56,189,248),0.07)' : 'none', border: 'none', cursor: 'pointer', borderLeft: subCategory === sub ? '2px solid var(--accent)' : '2px solid transparent' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: subCategory === sub ? 700 : 400, color: subCategory === sub ? 'var(--accent)' : 'var(--text-2)' }}>{sub}</span>
                  </button>
                ))}
              </div>
            )}

            {/* TER */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
              <div className="label" style={{ fontSize: '0.68rem', marginBottom: 10 }}>TER massimo</div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {TER_OPTIONS.map(opt => (
                  <button key={opt.label} className={`tab${terFilter === opt.value ? ' active' : ''}`}
                    style={{ padding: '5px 11px', fontSize: '0.72rem' }} onClick={() => setTerFilter(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Acc/Dist */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '14px 16px' }}>
              <div className="label" style={{ fontSize: '0.68rem', marginBottom: 10 }}>Distribuzione</div>
              <div style={{ display: 'flex', gap: 5 }}>
                {(['Tutti', 'Acc', 'Dist'] as const).map(d => (
                  <button key={d} className={`tab${distFilter === d ? ' active' : ''}`}
                    style={{ padding: '5px 11px', fontSize: '0.72rem' }} onClick={() => setDistFilter(d)}>
                    {d === 'Tutti' ? 'Tutti' : d}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider */}
            <div style={{ borderTop: '1px solid var(--border)', padding: '12px 0 8px' }}>
              <div className="label" style={{ fontSize: '0.68rem', padding: '0 16px 8px' }}>Provider</div>
              {providers.map(p => (
                <button key={p} onClick={() => setProviderFilter(p)}
                  style={{ width: '100%', textAlign: 'left', padding: '7px 16px', background: providerFilter === p ? 'rgba(var(--accent-rgb,56,189,248),0.07)' : 'none', border: 'none', cursor: 'pointer', borderLeft: providerFilter === p ? '2px solid var(--accent)' : '2px solid transparent' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: providerFilter === p ? 700 : 400, color: providerFilter === p ? 'var(--accent)' : 'var(--text-2)' }}>{p}</span>
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT: Results */}
        <div>
          {/* Sort bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-3)' }}>
              <span style={{ fontWeight: 700, color: 'var(--text-1)' }}>{filtered.length}</span> risultati
              {hasCart && (
                <span style={{ marginLeft: 12, fontSize: '0.75rem', color: 'var(--accent)' }}>
                  · {backtestCart.length + comparatorCart.length} selezionati
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-3)' }}>Ordina:</span>
              {([['Nome', 'name'], ['TER', 'ter'], ['Patrimonio', 'aum']] as [string, SortKey][]).map(([label, key]) => (
                <button key={key} onClick={() => handleSort(key)}
                  style={{ display: 'flex', alignItems: 'center', background: sortKey === key ? 'var(--surface-2)' : 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: sortKey === key ? 700 : 400, color: sortKey === key ? 'var(--text-1)' : 'var(--text-3)' }}>
                  {label}<SortIcon col={key} />
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ overflow: 'hidden', padding: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 65px 65px 80px 190px', padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
              <div className="label" style={{ fontSize: '0.68rem' }}>Strumento</div>
              <div className="label" style={{ fontSize: '0.68rem' }}>Provider</div>
              <div className="label" style={{ fontSize: '0.68rem' }}>Borsa</div>
              <div className="label" style={{ fontSize: '0.68rem' }}>TER</div>
              <div className="label" style={{ fontSize: '0.68rem' }}>AUM</div>
              <div className="label" style={{ fontSize: '0.68rem', textAlign: 'right' }}>Aggiungi a…</div>
            </div>

            {filtered.length === 0 ? (
              <div style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
                <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
                Nessun risultato{search ? <> per &quot;<strong>{search}</strong>&quot;</> : null}
              </div>
            ) : (
              filtered.map((etf: ETFEntry, i: number) => {
                const inBt  = !!backtestCart.find(e => e.ticker === etf.ticker)
                const inCmp = !!comparatorCart.find(e => e.ticker === etf.ticker)

                return (
                  <div key={etf.ticker}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 80px 65px 65px 80px 190px', alignItems: 'center', padding: '13px 20px', borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.12s', cursor: 'pointer', background: (inBt || inCmp) ? 'rgba(var(--accent-rgb,56,189,248),0.03)' : 'transparent' }}
                    onClick={() => router.push(`/etf/${encodeURIComponent(etf.ticker)}`)}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = (inBt || inCmp) ? 'rgba(var(--accent-rgb,56,189,248),0.03)' : 'transparent'}
                  >
                    {/* ETF info */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: 'var(--accent-dim)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TrendingUp size={14} color="var(--accent)" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{etf.name}</div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span className="badge badge-muted" style={{ fontSize: '0.65rem' }}>{etf.ticker}</span>
                          <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{etf.type}</span>
                          <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: 5, fontWeight: 600, background: 'rgba(var(--accent-rgb,56,189,248),0.1)', color: 'var(--accent)' }}>{etf.subCategory}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-3)', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {(() => { const d = getEtfDescription(etf); return d.replace(/⚠️\s*/g, '').slice(0, 120) + (d.length > 120 ? '…' : '') })()}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', fontWeight: 500 }}>{etf.provider}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-2)' }}>{etf.exchange}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{etf.ter != null ? `${etf.ter}%` : '—'}</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{fmtAum(etf.aum)}</div>

                    {/* Action buttons */}
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end', alignItems: 'center' }} onClick={e => e.stopPropagation()}>

                      {/* Backtest toggle */}
                      <button
                        onClick={() => toggleBt(etf)}
                        title={inBt ? 'Rimuovi dal Backtest' : 'Aggiungi al Backtest'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 9px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
                          border: '1px solid',
                          cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                          color: inBt ? '#000' : 'var(--accent)',
                          background: inBt ? 'var(--accent)' : 'rgba(var(--accent-rgb,56,189,248),0.1)',
                          borderColor: inBt ? 'var(--accent)' : 'rgba(var(--accent-rgb,56,189,248),0.3)',
                        }}
                      >
                        {inBt ? <CheckCircle2 size={11} /> : <BarChart2 size={11} />}
                        Backtest
                      </button>

                      {/* Comparatore toggle */}
                      <button
                        onClick={() => toggleCmp(etf)}
                        title={inCmp ? 'Rimuovi dal Confronto' : 'Aggiungi al Confronto'}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 9px', borderRadius: 8, fontSize: '0.7rem', fontWeight: 600,
                          border: '1px solid',
                          cursor: 'pointer', transition: 'all 0.12s', whiteSpace: 'nowrap',
                          color: inCmp ? '#fff' : '#a78bfa',
                          background: inCmp ? '#a78bfa' : 'rgba(167,139,250,0.1)',
                          borderColor: inCmp ? '#a78bfa' : 'rgba(167,139,250,0.3)',
                        }}
                      >
                        {inCmp ? <CheckCircle2 size={11} /> : <GitCompare size={11} />}
                        Confronta
                      </button>

                      <div style={{ color: 'var(--text-3)', display: 'flex', paddingLeft: 2 }}>
                        <ArrowUpRight size={13} />
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
