import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { ETF_CATALOG } from '@/lib/etf-catalog'
import { getCompositionProfile, getBondDuration } from '@/lib/etf-composition'

const yf = new YahooFinance()

const YF_MAP: Record<string, string> = {}
for (const e of ETF_CATALOG) {
  if (e.ticker !== e.tickerYF) YF_MAP[e.ticker] = e.tickerYF
}

const SECTOR_LABELS: Record<string, string> = {
  technology:             'Tecnologia',
  financial_services:     'Finanza',
  industrials:            'Industria',
  consumer_cyclical:      'Consumi discrezionali',
  healthcare:             'Sanità',
  consumer_defensive:     'Beni di consumo',
  communication_services: 'Comunicazione',
  energy:                 'Energia',
  basic_materials:        'Materiali',
  realestate:             'Immobiliare',
  utilities:              'Utility',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = decodeURIComponent(rawTicker)
  const yfTicker = YF_MAP[ticker] ?? ticker

  try {
    const summary = await yf.quoteSummary(yfTicker, {
      modules: ['topHoldings', 'summaryDetail'],
    }).catch(() => null)

    const th = summary?.topHoldings

    // Settori
    const sectors = (th?.sectorWeightings ?? [])
      .flatMap((sw: any) =>
        Object.entries(sw as Record<string, number>)
          .filter(([, v]) => typeof v === 'number' && v > 0)
          .map(([k, v]) => ({
            name: SECTOR_LABELS[k] ?? k,
            pct: Math.round((v as number) * 1000) / 10,
          }))
      )
      .sort((a: { pct: number }, b: { pct: number }) => b.pct - a.pct)

    // Top holdings
    const holdings = (th?.holdings ?? []).map((h: { holdingName: string; symbol: string; holdingPercent: number }) => ({
      name: h.holdingName,
      symbol: h.symbol,
      pct: Math.round(h.holdingPercent * 1000) / 10,
    }))

    // Asset mix
    const assetMix = {
      stock: th?.stockPosition != null ? Math.round(th.stockPosition * 1000) / 10 : null,
      bond:  th?.bondPosition  != null ? Math.round(th.bondPosition  * 1000) / 10 : null,
      cash:  th?.cashPosition  != null ? Math.round(th.cashPosition  * 1000) / 10 : null,
    }

    // Dati statici (geo + valute + holdings fallback)
    const staticData = getCompositionProfile(ticker)

    // Se Yahoo Finance non restituisce holdings (bond ETF, crypto, ETP)
    // usa i topHoldings statici come fallback
    const finalHoldings = holdings.length > 0
      ? holdings
      : (staticData?.topHoldings ?? []).map(h => ({ name: h.name, symbol: '', pct: h.pct }))

    const avgDurationYears = getBondDuration(ticker)

    return NextResponse.json(
      {
        sectors,
        holdings: finalHoldings,
        assetMix,
        geography:       staticData?.geography       ?? null,
        currencies:      staticData?.currencies      ?? null,
        avgDurationYears,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800' } }
    )
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
