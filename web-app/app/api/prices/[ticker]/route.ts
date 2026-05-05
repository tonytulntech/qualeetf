import { NextRequest, NextResponse } from 'next/server'
import YahooFinance from 'yahoo-finance2'
import { neon } from '@neondatabase/serverless'
import { ETF_CATALOG } from '@/lib/etf-catalog'

const yf = new YahooFinance()

const YF_MAP: Record<string, string> = {}
const PROXY_MAP: Record<string, string | null> = {}
for (const e of ETF_CATALOG) {
  if (e.ticker !== e.tickerYF) YF_MAP[e.ticker] = e.tickerYF
  PROXY_MAP[e.ticker] = e.proxy
}

type PriceRow = { date: string; close: number; is_synthetic: boolean }

type CacheEntry = { real: PriceRow[]; synthetic: PriceRow[]; source: string; ts: number }
const MEM_CACHE = new Map<string, CacheEntry>()
const MEM_TTL = 60 * 60 * 1000

function getDB() {
  const url = process.env.DATABASE_URL
  if (!url) return null
  return neon(url)
}

async function fetchFromDB(ticker: string): Promise<PriceRow[] | null> {
  const sql = getDB()
  if (!sql) return null

  try {
    const rows = await sql`
      SELECT p.date::text, p.close::float, p.is_synthetic
      FROM prices p
      JOIN instruments i ON i.id = p.instrument_id
      WHERE i.ticker = ${ticker}
      ORDER BY p.date ASC
    `
    if (!rows.length) return null
    return rows.map(r => ({
      date: r.date as string,
      close: r.close as number,
      is_synthetic: r.is_synthetic as boolean,
    }))
  } catch {
    return null
  }
}

async function fetchFromYahoo(symbol: string, from: string): Promise<PriceRow[]> {
  try {
    const data = await yf.chart(symbol, { period1: from, interval: '1d' })
    return data.quotes
      .map(q => ({
        date: q.date.toISOString().slice(0, 10),
        close: Math.round((q.adjclose ?? q.close ?? 0) * 10000) / 10000,
        is_synthetic: false,
      }))
      .filter(r => r.close > 0)
  } catch {
    return []
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker: rawTicker } = await params
  const ticker = decodeURIComponent(rawTicker)
  const yfTicker = YF_MAP[ticker] ?? ticker
  const proxyTicker = PROXY_MAP[ticker] ?? null

  const HEADERS = { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }

  const cached = MEM_CACHE.get(ticker)
  if (cached && Date.now() - cached.ts < MEM_TTL) {
    return NextResponse.json({ real: cached.real, synthetic: cached.synthetic, source: cached.source }, { headers: HEADERS })
  }

  // 1. Prova il DB
  const dbPrices = await fetchFromDB(ticker)

  if (dbPrices && dbPrices.length > 0) {
    const lastDate = dbPrices[dbPrices.length - 1].date
    const daysSinceLast = (Date.now() - new Date(lastDate).getTime()) / (1000 * 3600 * 24)

    if (daysSinceLast < 5) {
      const real = dbPrices.filter(p => !p.is_synthetic)
      const synthetic = dbPrices.filter(p => p.is_synthetic)
      MEM_CACHE.set(ticker, { real, synthetic, source: 'db', ts: Date.now() })
      return NextResponse.json({ real, synthetic, source: 'db' }, { headers: HEADERS })
    }

    const nextDate = new Date(lastDate)
    nextDate.setDate(nextDate.getDate() + 1)
    const fromStr = nextDate.toISOString().slice(0, 10)

    const newRows = await fetchFromYahoo(yfTicker, fromStr)
    const merged = [...dbPrices, ...newRows.map(r => ({ ...r, is_synthetic: false }))]
      .sort((a, b) => (a.date < b.date ? -1 : 1))

    const real = merged.filter(p => !p.is_synthetic)
    const synthetic = merged.filter(p => p.is_synthetic)
    MEM_CACHE.set(ticker, { real, synthetic, source: 'db+yahoo', ts: Date.now() })
    return NextResponse.json({ real, synthetic, source: 'db+yahoo' }, { headers: HEADERS })
  }

  // 2. Fallback Yahoo Finance
  const real = await fetchFromYahoo(yfTicker, '1990-01-01')

  if (real.length === 0) {
    return NextResponse.json({ real: [], synthetic: [] })
  }

  const yearsOfData = (Date.now() - new Date(real[0].date).getTime()) / (365.25 * 24 * 3600 * 1000)
  let synthetic: PriceRow[] = []

  const proxyRows = proxyTicker && yearsOfData < 29
    ? await fetchFromYahoo(proxyTicker, '1985-01-01')
    : []

  if (proxyTicker && yearsOfData < 29 && proxyRows.length > 0) {
    const linkRow = [...proxyRows].reverse().find(r => r.date <= real[0].date)
    if (linkRow && linkRow.close > 0) {
      const ratio = real[0].close / linkRow.close
      synthetic = proxyRows
        .filter(r => r.date < real[0].date)
        .map(r => ({
          date: r.date,
          close: Math.round(r.close * ratio * 10000) / 10000,
          is_synthetic: true,
        }))
        .filter(r => r.close > 0)
    }
  }

  MEM_CACHE.set(ticker, { real, synthetic, source: 'yahoo', ts: Date.now() })
  return NextResponse.json({ real, synthetic, source: 'yahoo' }, { headers: HEADERS })
}
