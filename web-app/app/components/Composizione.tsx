'use client'
import { useEffect, useState, useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

type SectorItem   = { name: string; pct: number }
type HoldingItem  = { name: string; symbol: string; pct: number }
type GeoItem      = { country: string; pct: number }
type CurrencyItem = { code: string; name: string; pct: number }

type HoldingsData = {
  sectors:   SectorItem[]
  holdings:  HoldingItem[]
  assetMix:  { stock: number | null; bond: number | null; cash: number | null }
  geography: GeoItem[] | null
  currencies: CurrencyItem[] | null
  avgDurationYears: number | null
}

const PALETTE = [
  '#6C8EF5', '#F5A76C', '#6CF5A7', '#F56C8E', '#C46CF5',
  '#F5E76C', '#6CF5F5', '#F5C46C', '#8EF56C', '#F56CF5',
  '#6C8EF5AA', '#F5A76CAA',
]

type Tab = 'geo' | 'settore' | 'valuta' | 'holdings'

function DonutChart({ data, nameKey, valueKey }: {
  data: Record<string, any>[]
  nameKey: string
  valueKey: string
}) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey={valueKey}
          nameKey={nameKey}
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={95}
          paddingAngle={1.5}
          startAngle={90}
          endAngle={-270}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: any) => [`${Number(v).toFixed(1)}%`]}
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

function ItemList({ items, labelKey, pctKey, colors }: {
  items: Record<string, any>[]
  labelKey: string
  pctKey: string
  colors: string[]
}) {
  const [expanded, setExpanded] = useState(false)
  const visible = expanded ? items : items.slice(0, 6)
  return (
    <div>
      {visible.map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10, marginBottom: 6,
          background: 'var(--surface-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: colors[i % colors.length], flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{item[labelKey]}</span>
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{item[pctKey].toFixed(1)}%</span>
        </div>
      ))}
      {items.length > 6 && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="btn btn-ghost"
          style={{ width: '100%', marginTop: 4, fontSize: '0.8rem', padding: '8px' }}
        >
          {expanded ? 'Mostra meno ▲' : `Mostra tutti (${items.length}) ▼`}
        </button>
      )}
    </div>
  )
}

export default function Composizione({ ticker }: { ticker: string }) {
  const [tab, setTab] = useState<Tab>('geo')
  const [data, setData] = useState<HoldingsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ticker) return
    setLoading(true)
    fetch(`/api/holdings/${encodeURIComponent(ticker)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [ticker])

  // Salta tab non disponibili
  const availableTabs: { key: Tab; label: string }[] = useMemo(() => {
    const tabs: { key: Tab; label: string }[] = []
    if (data?.geography?.length)  tabs.push({ key: 'geo',      label: 'Geografica' })
    if (data?.sectors?.length)    tabs.push({ key: 'settore',  label: 'Settore' })
    if (data?.currencies?.length) tabs.push({ key: 'valuta',   label: 'Valuta' })
    if (data?.holdings?.length)   tabs.push({ key: 'holdings', label: data.holdings.length === 1 ? 'Asset' : 'Titoli Principali' })
    return tabs
  }, [data])

  useEffect(() => {
    if (availableTabs.length && !availableTabs.find(t => t.key === tab)) {
      setTab(availableTabs[0].key)
    }
  }, [availableTabs])

  if (loading) return (
    <div className="card" style={{ padding: '24px 20px', marginBottom: 24 }}>
      <div style={{ height: 18, width: 180, background: 'var(--surface-2)', borderRadius: 6, marginBottom: 20 }} />
      <div style={{ height: 220, background: 'var(--surface-2)', borderRadius: 12 }} />
    </div>
  )

  if (!data || (!data.geography?.length && !data.sectors?.length && !data.holdings?.length)) return null

  const geoData      = data.geography  ?? []
  const currData     = data.currencies ?? []
  const sectorData   = data.sectors    ?? []
  const holdingsData = data.holdings   ?? []
  const duration     = data.avgDurationYears ?? null

  const topHoldingsPct = holdingsData.reduce((s, h) => s + h.pct, 0)

  // Duration helpers
  const durationColor = (d: number) =>
    d < 0.1 ? '#22c55e' : d < 2 ? '#84cc16' : d < 5 ? '#f59e0b' : d < 9 ? '#f97316' : '#ef4444'
  const durationLabel = (d: number) =>
    d < 0.1 ? 'Overnight' : d < 2 ? 'Ultra-corta' : d < 4 ? 'Breve' : d < 7 ? 'Media' : d < 12 ? 'Lunga' : 'Molto lunga'

  return (
    <div className="card" style={{ padding: '24px 20px', marginBottom: 24 }}>

      {/* Duration badge — solo per ETF obbligazionari */}
      {duration !== null && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '14px 18px', borderRadius: 12, marginBottom: 20,
          background: 'var(--surface-2)', border: `1px solid ${durationColor(duration)}40`,
        }}>
          {/* Numero grande */}
          <div style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.04em', color: durationColor(duration), lineHeight: 1 }}>
              {duration < 0.1 ? '≈0' : duration.toFixed(1)}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: durationColor(duration), textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              anni
            </div>
          </div>
          {/* Barra visiva */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: 5 }}>
              <span style={{ fontWeight: 700 }}>Duration media ponderata</span>
              <span style={{ color: durationColor(duration), fontWeight: 700 }}>{durationLabel(duration)}</span>
            </div>
            <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ height: '100%', width: `${Math.min(duration / 20 * 100, 100)}%`, background: durationColor(duration), borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-3)' }}>
              {duration < 0.1
                ? 'Immune alle variazioni di tasso — replica il tasso overnight della BCE'
                : `Per ogni +1% dei tassi d'interesse, il prezzo scende di circa ${duration.toFixed(1)}%`}
            </div>
          </div>
          {/* Pill sensibilità */}
          {duration >= 0.1 && (
            <div style={{ textAlign: 'center', minWidth: 72 }}>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ef4444', letterSpacing: '-0.03em' }}>
                −{duration.toFixed(1)}%
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-3)', lineHeight: 1.3 }}>se tassi<br />+1%</div>
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <div className="label" style={{ marginBottom: 10 }}>Composizione</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {availableTabs.map(t => (
            <button
              key={t.key}
              className={`tab ${tab === t.key ? 'active' : ''}`}
              onClick={() => setTab(t.key)}
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>

        {/* Donut */}
        <div>
          {tab === 'geo' && geoData.length > 0 && (
            <DonutChart data={geoData} nameKey="country" valueKey="pct" />
          )}
          {tab === 'settore' && sectorData.length > 0 && (
            <DonutChart data={sectorData} nameKey="name" valueKey="pct" />
          )}
          {tab === 'valuta' && currData.length > 0 && (
            <DonutChart data={currData} nameKey="code" valueKey="pct" />
          )}
          {tab === 'holdings' && holdingsData.length > 0 && (
            <>
              <DonutChart
                data={holdingsData.length === 1
                  ? holdingsData.map(h => ({ name: h.name, pct: h.pct }))
                  : [
                      ...holdingsData.map(h => ({ name: h.name, pct: h.pct })),
                      ...(topHoldingsPct < 99.5 ? [{ name: 'Altri', pct: Math.max(0, 100 - topHoldingsPct) }] : []),
                    ]
                }
                nameKey="name"
                valueKey="pct"
              />
              {holdingsData.length > 1 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                  <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                    <div className="label" style={{ marginBottom: 4, fontSize: '0.68rem' }}>Peso Top {holdingsData.length}</div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{topHoldingsPct.toFixed(1)}%</div>
                  </div>
                  {data.assetMix.stock != null && (
                    <div style={{ background: 'var(--surface-2)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                      <div className="label" style={{ marginBottom: 4, fontSize: '0.68rem' }}>Azioni</div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{data.assetMix.stock}%</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Lista */}
        <div>
          {tab === 'geo' && (
            <ItemList items={geoData} labelKey="country" pctKey="pct" colors={PALETTE} />
          )}
          {tab === 'settore' && (
            <ItemList items={sectorData} labelKey="name" pctKey="pct" colors={PALETTE} />
          )}
          {tab === 'valuta' && (
            <ItemList items={currData.map(c => ({ ...c, label: `${c.name} (${c.code})` }))} labelKey="label" pctKey="pct" colors={PALETTE} />
          )}
          {tab === 'holdings' && (
            <ItemList items={holdingsData} labelKey="name" pctKey="pct" colors={PALETTE} />
          )}
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: '0.72rem', color: 'var(--text-3)', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
        {data.holdings?.length === 1
          ? 'Asset singolo — posizione al 100% sull\'asset sottostante'
          : 'Dati geografici e valutari aggiornati trimestralmente · Settori e holdings da Yahoo Finance'}
      </div>
    </div>
  )
}
