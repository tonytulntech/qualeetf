'use client'
import './globals.css'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Sun, Moon, TrendingUp, Search, BarChart2, BookOpen } from 'lucide-react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('cheetf-theme') as 'dark' | 'light' | null
    if (saved) setTheme(saved)
  }, [])

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('cheetf-theme', next)
  }

  return (
    <html lang="it" data-theme={theme} suppressHydrationWarning>
      <head>
        <title>CheETF — Analisi e Backtest ETF</title>
        <meta name="description" content="Analizza, confronta e fai backtest dei migliori ETF europei." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body suppressHydrationWarning>
        {/* Ambient orbs */}
        <div className="orb" style={{ width: 600, height: 600, top: -200, left: -200, background: 'var(--accent)', opacity: 0.05 }} />
        <div className="orb" style={{ width: 400, height: 400, bottom: -100, right: -100, background: '#E87B7B', opacity: 0.04 }} />

        {/* Navbar */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          background: 'var(--surface)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderBottom: '1px solid var(--border)',
          height: 60, padding: '0 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <TrendingUp size={16} color="#000" strokeWidth={2.5} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-1)' }}>
              Che<span style={{ color: 'var(--accent)' }}>ETF</span>
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {[
              { href: '/screener', icon: <Search size={14} />, label: 'Screener' },
              { href: '/backtest', icon: <BarChart2 size={14} />, label: 'Backtest' },
              { href: '/etf/SWDA.MI', icon: <BookOpen size={14} />, label: 'Esplora ETF' },
            ].map(item => (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 13px', borderRadius: 9,
                fontSize: '0.8375rem', fontWeight: 500,
                color: 'var(--text-2)', textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'var(--surface-2)'
                el.style.color = 'var(--text-1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.background = 'transparent'
                el.style.color = 'var(--text-2)'
              }}>
                {item.icon} {item.label}
              </Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={toggleTheme} className="btn btn-ghost" style={{ padding: '7px 9px', borderRadius: 9 }}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <Link href="/screener" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem', borderRadius: 10 }}>
              Inizia gratis
            </Link>
          </div>
        </nav>

        <main style={{ paddingTop: 60, position: 'relative', zIndex: 1, minHeight: '100dvh' }}>
          {children}
        </main>
      </body>
    </html>
  )
}
