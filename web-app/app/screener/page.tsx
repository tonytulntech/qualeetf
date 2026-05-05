'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, TrendingUp, ArrowUpRight, SlidersHorizontal, X, ChevronUp, ChevronDown } from 'lucide-react'
import { ETF_CATALOG, ALL_CATEGORIES, SUB_CATEGORIES, type ETFEntry } from '@/lib/etf-catalog'

const CATEGORY_TABS = ['Tutti', ...ALL_CATEGORIES, 'Monetari', 'Leva'] as const
const DISABLED_TABS = new Set(['Monetari', 'Leva'])
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

export default function Screener() {
  const [category, setCategory] = useState('Tutti')
  const [subCategory, setSubCategory] = useState('Tutti')
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('Tutti')
  const [terFilter, setTerFilter] = useState<number | null>(null)
  const [distFilter, setDistFilter] = useState<'Tutti' | 'Acc' | 'Dist'>('Tutti')
  const [sortKey, setSortKey] = useState<SortKey>('none')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [showFilters, setShowFilters] = useState(false)

  function handleCategoryChange(cat: string) {
    setCategory(cat)
    setSubCategory('Tutti')
  }

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

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
    providerFilter !== 'Tutti',
    terFilter !== null,
    distFilter !== 'Tutti',
  ].filter(Boolean).length

  function resetFilters() {
    setProviderFilter('Tutti')
    setTerFilter(null)
    setDistFilter('Tutti')
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ChevronDown size={11} style={{ opacity: 0.3, marginLeft: 3 }} />
    return sortDir === 'asc'
      ? <ChevronUp size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
      : <ChevronDown size={11} style={{ color: 'var(--accent)', marginLeft: 3 }} />
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

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

      {/* Category tabs row */}
      <div style={{
        display: 'flex', gap: 8, flexWrap: 'nowrap', overflowX: 'auto',
        paddingBottom: 4, marginBottom: 12, scrollbarWidth: 'none',
      }}>
        {CATEGORY_TABS.map(cat => {
          const isDisabled = DISABLED_TABS.has(cat)
          const isActive = category === cat
          const count = cat !== 'Tutti' && !isDisabled ? categoryCounts[cat] : null
          return (
            <div key={cat} style={{ position: 'relative', flexShrink: 0 }}>
              <button
                className={isActive ? 'btn btn-primary' : 'btn btn-ghost'}
                style={{
                  padding: '8px 18px', borderRadius: 20, fontSize: '0.875rem',
                  fontWeight: 600, whiteSpace: 'nowrap', gap: 6,
                  ...(isDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
                }}
                onClick={() => !isDisabled && handleCategoryChange(cat)}
                disabled={isDisabled}
              >
                {cat}
                {count != null && (
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--surface-3, rgba(100,116,139,0.15))',
                    color: isActive ? 'inherit' : 'var(--text-3)',
                    lineHeight: 1.5,
                  }}>
                    {count}
                  </span>
                )}
              </button>
              {isDisabled && (
                <span style={{
                  position: 'absolute', top: -6, right: -2,
                  fontSize: '0.6rem', fontWeight: 700, padding: '1px 5px',
                  borderRadius: 6, background: 'var(--surface-3, #334155)',
                  color: 'var(--text-2)', border: '1px solid var(--border)',
                  pointerEvents: 'none', lineHeight: 1.4,
                }}>
                  Presto
                </span>
              )}
            </div>
          )
        })}
      </div>

      {/* Sub-category chips */}
      {showSubCats && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {(['Tutti', ...currentSubCategories]).map(sub => (
            <button
              key={sub}
              className={`tab ${subCategory === sub ? 'active' : ''}`}
              style={{ padding: '5px 14px', borderRadius: 16, fontSize: '0.8rem' }}
              onClick={() => setSubCategory(sub)}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Search + Filtri bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            className="input"
            style={{ paddingLeft: 40 }}
            placeholder="Cerca per nome, ticker o ISIN…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className={`btn ${showFilters || activeFilterCount > 0 ? 'btn-primary' : 'btn-ghost'}`}
          style={{ padding: '11px 16px', borderRadius: 12, gap: 6 }}
          onClick={() => setShowFilters(v => !v)}
        >
          <SlidersHorizontal size={15} />
          Filtri {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="card" style={{ padding: '18px 20px', marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* TER */}
          <div>
            <div className="label" style={{ marginBottom: 10 }}>TER massimo</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {TER_OPTIONS.map(opt => (
                <button key={opt.label} className={`tab ${terFilter === opt.value ? 'active' : ''}`}
                  onClick={() => setTerFilter(opt.value)} style={{ padding: '6px 14px' }}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Acc / Dist */}
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Politica di distribuzione</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['Tutti', 'Acc', 'Dist'] as const).map(d => (
                <button key={d} className={`tab ${distFilter === d ? 'active' : ''}`}
                  onClick={() => setDistFilter(d)} style={{ padding: '6px 14px' }}>
                  {d === 'Tutti' ? 'Tutti' : d === 'Acc' ? 'Accumulazione' : 'Distribuzione'}
                </button>
              ))}
            </div>
          </div>

          {/* Provider */}
          <div>
            <div className="label" style={{ marginBottom: 10 }}>Provider</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {providers.map(p => (
                <button key={p} className={`tab ${providerFilter === p ? 'active' : ''}`}
                  onClick={() => setProviderFilter(p)} style={{ padding: '6px 14px' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>

          {activeFilterCount > 0 && (
            <div>
              <button onClick={resetFilters} className="btn btn-ghost" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>
                <X size={13} /> Reset tutti i filtri
              </button>
            </div>
          )}
        </div>
      )}

      {/* Results count */}
      <div style={{ marginBottom: 12, fontSize: '0.8125rem', color: 'var(--text-3)' }}>
        {filtered.length} risultati
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden', padding: 0 }}>

        {/* Table header — sortable */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 90px 48px',
          padding: '11px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <button onClick={() => handleSort('name')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', textAlign: 'left' }}>
            <span className="label" style={{ fontSize: '0.7rem' }}>Strumento</span>
            <SortIcon col="name" />
          </button>
          <div className="label" style={{ fontSize: '0.7rem' }}>Provider</div>
          <div className="label" style={{ fontSize: '0.7rem' }}>Borsa</div>
          <button onClick={() => handleSort('ter')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span className="label" style={{ fontSize: '0.7rem' }}>TER</span>
            <SortIcon col="ter" />
          </button>
          <button onClick={() => handleSort('aum')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <span className="label" style={{ fontSize: '0.7rem' }}>Patrimonio</span>
            <SortIcon col="aum" />
          </button>
          <div />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-2)' }}>
            <Search size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
            Nessun risultato{search ? <> per &quot;<strong>{search}</strong>&quot;</> : null}
          </div>
        ) : (
          filtered.map((etf: ETFEntry, i: number) => (
            <Link key={etf.ticker} href={`/etf/${encodeURIComponent(etf.ticker)}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <div
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 70px 70px 90px 48px',
                  alignItems: 'center', padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background var(--transition)', cursor: 'pointer',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--surface-2)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'var(--accent-dim)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <TrendingUp size={15} color="var(--accent)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 3 }}>{etf.name}</div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-muted" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>{etf.ticker}</span>
                      <span className="badge badge-blue" style={{ fontSize: '0.68rem', padding: '2px 7px' }}>{etf.type}</span>
                      <span style={{
                        fontSize: '0.65rem', padding: '2px 7px', borderRadius: 6, fontWeight: 600,
                        background: 'rgba(var(--accent-rgb, 56,189,248), 0.12)',
                        color: 'var(--accent)',
                      }}>
                        {etf.subCategory}
                      </span>
                      {etf.isin && (
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-3)', fontFamily: 'monospace' }}>{etf.isin}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)', fontWeight: 500 }}>{etf.provider}</div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-2)' }}>{etf.exchange}</div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>
                  {etf.ter != null ? `${etf.ter}%` : '—'}
                </div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-1)' }}>
                  {fmtAum(etf.aum)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <ArrowUpRight size={14} color="var(--text-3)" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
