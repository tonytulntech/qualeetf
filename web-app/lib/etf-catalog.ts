// Source of truth per tutti gli ETF della piattaforma.
// Nessuna dipendenza da database — funziona sempre, anche offline.
// Per aggiungere un ETF: aggiungi una riga a ETF_CATALOG.

export type ETFEntry = {
  id: number          // id stabile basato su posizione (1-indexed)
  isin: string
  ticker: string      // ticker DB / visualizzato (es. SWDA.MI)
  tickerYF: string    // ticker usato per yahoo-finance (può differire)
  exchange: string
  name: string
  ter: number
  type: 'ETF' | 'ETC' | 'ETN' | 'ETP'
  provider: string
  underlyingIndex: string
  proxy: string | null  // ticker yahoo usato per storia sintetica
  category: string   // 'Azionari' | 'Obbligazionari' | 'Bilanciati' | 'Materie Prime' | 'Metalli Preziosi' | 'Criptovalute'
  subCategory: string
  aum: number | null  // patrimonio in milioni EUR (approx., fonte pubblica)
}

export const ALL_CATEGORIES = ['Azionari', 'Obbligazionari', 'Bilanciati', 'Materie Prime', 'Metalli Preziosi', 'Criptovalute'] as const

export const SUB_CATEGORIES: Record<string, string[]> = {
  'Azionari':         ['Globale', 'USA', 'NASDAQ', 'Europa', 'Emergenti', 'Asia', 'Small Cap', 'Immobiliare', 'Dividendi', 'Tecnologia', 'Healthcare', 'Energia', 'Finanza', 'Factor', 'ESG'],
  'Obbligazionari':   ['Globali', 'Governativi', 'Corporate', 'High Yield', 'Inflation-Linked'],
  'Bilanciati':       ['Multi-Asset'],
  'Materie Prime':    ['Diversificato', 'Metalli Industriali'],
  'Metalli Preziosi': ['Oro'],
  'Criptovalute':     ['Bitcoin'],
}

// formato interno: [isin, tickerYF, ticker, exchange, name, ter, type, provider, underlyingIndex, category, subCategory]
const RAW: [string, string, string, string, string, number, string, string, string, string, string][] = [
  // ── Azionario Globale ────────────────────────────────────────────────────
  ["IE00B4L5Y983", "SWDA.MI",   "SWDA.MI",   "BIT",      "iShares Core MSCI World UCITS ETF USD (Acc)",                0.20, "ETF", "iShares",   "MSCI World",                                               "Azionari", "Globale"],
  ["IE00BK5BQT80", "VWCE.DE",   "VWCE.DE",   "XETRA",    "Vanguard FTSE All-World UCITS ETF USD (Acc)",               0.22, "ETF", "Vanguard",  "FTSE All-World",                                           "Azionari", "Globale"],
  ["IE00BK5BQT80", "VWRA.L",    "VWRA.L",    "LSE",      "Vanguard FTSE All-World UCITS ETF USD (Acc)",               0.22, "ETF", "Vanguard",  "FTSE All-World",                                           "Azionari", "Globale"],
  ["IE00B3RBWM25", "VWRL.L",    "VWRL.L",    "LSE",      "Vanguard FTSE All-World UCITS ETF USD (Dist)",              0.22, "ETF", "Vanguard",  "FTSE All-World",                                           "Azionari", "Globale"],
  ["IE00B6R52259", "IUSQ.DE",   "IUSQ.DE",   "XETRA",    "iShares MSCI ACWI UCITS ETF USD (Acc)",                    0.20, "ETF", "iShares",   "MSCI ACWI",                                                "Azionari", "Globale"],
  ["IE00B441G979", "FWRA.MI",   "FWRA.MI",   "BIT",      "Invesco FTSE All-World UCITS ETF USD (Acc)",                0.15, "ETF", "Invesco",   "FTSE All-World",                                           "Azionari", "Globale"],
  ["IE00077FRP95", "MEUD.MI",   "MEUD.MI",   "BIT",      "Amundi MSCI World UCITS ETF EUR (Acc)",                    0.12, "ETF", "Amundi",    "MSCI World",                                               "Azionari", "Globale"],
  ["IE00BD45KH83", "LCWD.MI",   "LCWD.MI",   "BIT",      "L&G Core Global Equity UCITS ETF USD (Acc)",               0.10, "ETF", "L&G",       "MSCI World",                                               "Azionari", "Globale"],
  ["IE00B60SX394", "HMWO.L",    "HMWO.L",    "LSE",      "HSBC MSCI World UCITS ETF USD (Acc)",                      0.15, "ETF", "HSBC",      "MSCI World",                                               "Azionari", "Globale"],
  // ── S&P 500 ──────────────────────────────────────────────────────────────
  ["IE00B5BMR087", "CSPX.L",    "CSPX.L",    "LSE",      "iShares Core S&P 500 UCITS ETF USD (Acc)",                 0.07, "ETF", "iShares",   "S&P 500",                                                  "Azionari", "USA"],
  ["IE00BFMXXD54", "SXR8.DE",   "SXR8.DE",   "XETRA",    "iShares Core S&P 500 UCITS ETF USD (Acc)",                 0.07, "ETF", "iShares",   "S&P 500",                                                  "Azionari", "USA"],
  ["IE00B5BMR087", "CSP1.MI",   "CSP1.MI",   "BIT",      "iShares Core S&P 500 UCITS ETF USD (Acc)",                 0.07, "ETF", "iShares",   "S&P 500",                                                  "Azionari", "USA"],
  ["IE00B3XXRP09", "VUAA.MI",   "VUAA.MI",   "BIT",      "Vanguard S&P 500 UCITS ETF USD (Acc)",                     0.07, "ETF", "Vanguard",  "S&P 500",                                                  "Azionari", "USA"],
  ["IE00BKX55T58", "VUSA.MI",   "VUSA.MI",   "BIT",      "Vanguard S&P 500 UCITS ETF USD (Dist)",                    0.07, "ETF", "Vanguard",  "S&P 500",                                                  "Azionari", "USA"],
  ["LU1681049097", "CSX5.DE",   "CSX5.DE",   "XETRA",    "Amundi S&P 500 UCITS ETF EUR (Acc)",                       0.07, "ETF", "Amundi",    "S&P 500",                                                  "Azionari", "USA"],
  ["IE00B3YCGJ38", "SPXS.MI",   "SPXS.MI",   "BIT",      "SPDR S&P 500 UCITS ETF USD (Dist)",                        0.03, "ETF", "SPDR",      "S&P 500",                                                  "Azionari", "USA"],
  ["IE00BYML9W36", "LSPU.MI",   "LSPU.MI",   "BIT",      "L&G S&P 500 UCITS ETF USD (Acc)",                          0.10, "ETF", "L&G",       "S&P 500",                                                  "Azionari", "USA"],
  // ── NASDAQ ───────────────────────────────────────────────────────────────
  ["IE0032077012", "EQQQ.MI",   "EQQQ.MI",   "BIT",      "Invesco NASDAQ-100 UCITS ETF USD (Acc)",                   0.30, "ETF", "Invesco",   "NASDAQ-100",                                               "Azionari", "NASDAQ"],
  ["IE00B53SZB19", "CNDX.MI",   "CNDX.MI",   "BIT",      "iShares NASDAQ-100 UCITS ETF USD (Acc)",                   0.33, "ETF", "iShares",   "NASDAQ-100",                                               "Azionari", "NASDAQ"],
  ["LU1829221024", "LQQ.PA",    "LQQ.PA",    "EURONEXT", "Amundi NASDAQ-100 II UCITS ETF EUR (Acc)",                 0.23, "ETF", "Amundi",    "NASDAQ-100",                                               "Azionari", "NASDAQ"],
  // ── MSCI Europe ──────────────────────────────────────────────────────────
  ["IE00B60SX170", "SMEA.MI",   "SMEA.MI",   "BIT",      "iShares Core MSCI Europe UCITS ETF EUR (Acc)",             0.12, "ETF", "iShares",   "MSCI Europe",                                              "Azionari", "Europa"],
  ["IE00B945VV12", "VEUR.MI",   "VEUR.MI",   "BIT",      "Vanguard FTSE Developed Europe UCITS ETF EUR (Dist)",      0.10, "ETF", "Vanguard",  "FTSE Developed Europe",                                    "Azionari", "Europa"],
  ["LU0908500753", "LYYS.DE",   "LYYS.DE",   "XETRA",    "Amundi MSCI Europe UCITS ETF EUR (Acc)",                   0.15, "ETF", "Amundi",    "MSCI Europe",                                              "Azionari", "Europa"],
  ["IE00B60SX487", "SXRJ.DE",   "SXRJ.DE",   "XETRA",    "iShares Core Euro STOXX 50 UCITS ETF EUR (Acc)",           0.10, "ETF", "iShares",   "Euro Stoxx 50",                                            "Azionari", "Europa"],
  ["DE0005933956", "EXW1.DE",   "EXW1.DE",   "XETRA",    "iShares Core EURO STOXX 50 UCITS ETF (DE) EUR (Acc)",      0.10, "ETF", "iShares",   "Euro Stoxx 50",                                            "Azionari", "Europa"],
  // ── Emerging Markets ─────────────────────────────────────────────────────
  ["IE00BKM4GZ66", "IS3N.DE",   "IS3N.DE",   "XETRA",    "iShares Core MSCI EM IMI UCITS ETF USD (Acc)",             0.18, "ETF", "iShares",   "MSCI Emerging Markets IMI",                                "Azionari", "Emergenti"],
  ["IE00B3F81G20", "EMIM.MI",   "EMIM.MI",   "BIT",      "iShares Core MSCI EM IMI UCITS ETF USD (Dist)",            0.18, "ETF", "iShares",   "MSCI Emerging Markets IMI",                                "Azionari", "Emergenti"],
  ["IE00B3CNHF18", "VFEM.MI",   "VFEM.MI",   "BIT",      "Vanguard FTSE Emerging Markets UCITS ETF USD (Dist)",      0.22, "ETF", "Vanguard",  "FTSE Emerging Markets",                                    "Azionari", "Emergenti"],
  ["IE00B469F816", "SEMA.MI",   "SEMA.MI",   "BIT",      "SPDR MSCI Emerging Markets UCITS ETF USD (Acc)",           0.42, "ETF", "SPDR",      "MSCI Emerging Markets",                                    "Azionari", "Emergenti"],
  ["LU1681045370", "AEEM.MI",   "AEEM.MI",   "BIT",      "Amundi MSCI Emerging Markets UCITS ETF EUR (Acc)",         0.20, "ETF", "Amundi",    "MSCI Emerging Markets",                                    "Azionari", "Emergenti"],
  // ── Asia Pacific / Japan ─────────────────────────────────────────────────
  ["IE00B02KXH56", "IJPA.L",    "IJPA.L",    "LSE",      "iShares Core MSCI Japan IMI UCITS ETF USD (Acc)",          0.15, "ETF", "iShares",   "MSCI Japan IMI",                                           "Azionari", "Asia"],
  ["IE00B95PGT31", "VJPN.MI",   "VJPN.MI",   "BIT",      "Vanguard FTSE Japan UCITS ETF USD (Acc)",                  0.15, "ETF", "Vanguard",  "FTSE Japan",                                               "Azionari", "Asia"],
  ["IE00B5WW6R17", "IASP.L",    "IASP.L",    "LSE",      "iShares Core MSCI Pacific ex-Japan UCITS ETF USD (Acc)",   0.20, "ETF", "iShares",   "MSCI Pacific ex-Japan",                                    "Azionari", "Asia"],
  // ── Small Cap ────────────────────────────────────────────────────────────
  ["IE00B3VVMM84", "IUSN.DE",   "IUSN.DE",   "XETRA",    "iShares MSCI World Small Cap UCITS ETF USD (Acc)",         0.35, "ETF", "iShares",   "MSCI World Small Cap",                                     "Azionari", "Small Cap"],
  ["IE00B42W4L06", "WSML.MI",   "WSML.MI",   "BIT",      "SPDR MSCI World Small Cap UCITS ETF USD (Acc)",            0.45, "ETF", "SPDR",      "MSCI World Small Cap",                                     "Azionari", "Small Cap"],
  // ── Obbligazioni Globali ─────────────────────────────────────────────────
  ["IE00BDBRDM35", "AGGH.MI",   "AGGH.MI",   "BIT",      "iShares Core Global Aggregate Bond UCITS ETF EUR Hedged (Acc)", 0.10, "ETF", "iShares",   "Bloomberg Global Aggregate",                          "Obbligazionari", "Globali"],
  ["IE00BG47KJ78", "VAGF.MI",   "VAGF.MI",   "BIT",      "Vanguard Global Aggregate Bond UCITS ETF EUR Hedged (Acc)", 0.10, "ETF", "Vanguard",  "Bloomberg Global Aggregate",                              "Obbligazionari", "Globali"],
  ["IE00BYZZ5V50", "XBAG.DE",   "XBAG.DE",   "XETRA",    "Xtrackers Bloomberg Global Agg Bond UCITS ETF EUR Hedged (Acc)", 0.10, "ETF", "Xtrackers", "Bloomberg Global Aggregate",                        "Obbligazionari", "Globali"],
  // ── Obbligazioni Governative ─────────────────────────────────────────────
  ["IE00B3F81409", "IGLT.L",    "IGLT.L",    "LSE",      "iShares Core UK Gilts UCITS ETF GBP (Dist)",               0.07, "ETF", "iShares",   "FTSE Actuaries UK Gilts",                                  "Obbligazionari", "Governativi"],
  ["IE00B1FZSC47", "IBTS.MI",   "IBTS.MI",   "BIT",      "iShares Euro Government Bond 1-3yr UCITS ETF EUR (Acc)",   0.15, "ETF", "iShares",   "Bloomberg Euro Treasury 1-3 Year",                         "Obbligazionari", "Governativi"],
  ["IE00B4WXJJ64", "CSBGE0.DE", "CSBGE0.DE", "XETRA",    "iShares Core Euro Government Bond UCITS ETF EUR (Acc)",    0.09, "ETF", "iShares",   "Bloomberg Euro Treasury",                                  "Obbligazionari", "Governativi"],
  ["IE00BYXGMM52", "VETY.MI",   "VETY.MI",   "BIT",      "Vanguard EUR Eurozone Government Bond UCITS ETF EUR (Acc)", 0.07, "ETF", "Vanguard",  "Bloomberg Euro Government Float Adj",                     "Obbligazionari", "Governativi"],
  ["IE00B3VTML14", "ETLB.MI",   "ETLB.MI",   "BIT",      "Xtrackers Eurozone Government Bond UCITS ETF EUR (Acc)",   0.15, "ETF", "Xtrackers", "Bloomberg Euro Government",                                "Obbligazionari", "Governativi"],
  ["IE00BLDGH553", "IEGE.MI",   "IEGE.MI",   "BIT",      "iShares EUR Govt Bond Climate UCITS ETF EUR (Acc)",        0.09, "ETF", "iShares",   "Bloomberg Euro Government",                                "Obbligazionari", "Governativi"],
  // ── Obbligazioni Corporate ───────────────────────────────────────────────
  ["IE00B3F81R35", "EUNA.DE",   "EUNA.DE",   "XETRA",    "iShares Core Euro Corporate Bond UCITS ETF EUR (Acc)",     0.20, "ETF", "iShares",   "Bloomberg Euro Corporate Bond",                            "Obbligazionari", "Corporate"],
  ["IE00BZ163G84", "VCBO.MI",   "VCBO.MI",   "BIT",      "Vanguard EUR Corporate Bond UCITS ETF EUR (Dist)",         0.09, "ETF", "Vanguard",  "Bloomberg Euro Corporate Bond",                            "Obbligazionari", "Corporate"],
  ["IE00BF11F565", "IEAA.L",    "IEAA.L",    "LSE",      "iShares Core EUR Corporate Bond UCITS ETF EUR (Acc)",      0.20, "ETF", "iShares",   "Bloomberg Euro Corporate Bond",                            "Obbligazionari", "Corporate"],
  // ── High Yield ───────────────────────────────────────────────────────────
  ["IE00B66F4759", "IHYG.MI",   "IHYG.MI",   "BIT",      "iShares EUR High Yield Corporate Bond UCITS ETF EUR (Dist)", 0.50, "ETF", "iShares",   "Bloomberg Pan-European High Yield",                     "Obbligazionari", "High Yield"],
  ["IE00B4PY7Y77", "HYLD.DE",   "HYLD.DE",   "XETRA",    "Xtrackers EUR High Yield Corporate Bond UCITS ETF EUR (Acc)", 0.20, "ETF", "Xtrackers", "Bloomberg Pan-European High Yield",                    "Obbligazionari", "High Yield"],
  // ── Inflazione ───────────────────────────────────────────────────────────
  ["IE00B3B8Q275", "IBCI.MI",   "IBCI.MI",   "BIT",      "iShares Euro Inflation Linked Govt Bond UCITS ETF EUR (Acc)", 0.09, "ETF", "iShares",   "Bloomberg Euro Government Inflation-Linked",            "Obbligazionari", "Inflation-Linked"],
  ["IE00B3VTQ640", "TIPS.L",    "TIPS.L",    "LSE",      "iShares USD TIPS UCITS ETF USD (Acc)",                     0.10, "ETF", "iShares",   "Bloomberg US Treasury Inflation-Linked",                   "Obbligazionari", "Inflation-Linked"],
  // ── Real Estate ──────────────────────────────────────────────────────────
  ["IE00B1FZS350", "IWDP.L",    "IWDP.MI",   "BIT",      "iShares Developed Markets Property Yield UCITS ETF USD (Dist)", 0.59, "ETF", "iShares",   "FTSE EPRA/NAREIT Developed",                          "Azionari", "Immobiliare"],
  ["IE00B8GF1M35", "EPRA.MI",   "EPRA.MI",   "BIT",      "Amundi FTSE EPRA/NAREIT Global UCITS ETF USD (Dist)",      0.24, "ETF", "Amundi",    "FTSE EPRA/NAREIT Real Estate",                             "Azionari", "Immobiliare"],
  ["IE00B83YJG36", "IPRP.L",    "REIT.MI",   "BIT",      "iShares European Property Yield UCITS ETF EUR (Dist)",     0.40, "ETF", "iShares",   "FTSE EPRA/NAREIT Europe",                                  "Azionari", "Immobiliare"],
  // ── Dividendi ────────────────────────────────────────────────────────────
  ["IE00B0M62Q58", "IDVY.L",    "IDVY.MI",   "BIT",      "iShares Euro Dividend UCITS ETF EUR (Dist)",               0.40, "ETF", "iShares",   "Dow Jones EURO STOXX Select Dividend 30",                  "Azionari", "Dividendi"],
  ["IE00B8GKDB10", "VHYL.MI",   "VHYL.MI",   "BIT",      "Vanguard FTSE All-World High Dividend Yield UCITS ETF USD (Dist)", 0.29, "ETF", "Vanguard",  "FTSE All-World High Dividend Yield",               "Azionari", "Dividendi"],
  ["IE00B9CQXS71", "ZPRG.DE",   "ZPRG.DE",   "XETRA",    "SPDR S&P Global Dividend Aristocrats UCITS ETF USD (Dist)", 0.45, "ETF", "SPDR",      "S&P Global Dividend Aristocrats",                         "Azionari", "Dividendi"],
  // ── Settore Technology ───────────────────────────────────────────────────
  ["IE00B3WJKG14", "QDVE.DE",   "QDVE.DE",   "XETRA",    "iShares S&P 500 Information Technology Sector UCITS ETF USD (Acc)", 0.15, "ETF", "iShares",   "S&P 500 Information Technology",                "Azionari", "Tecnologia"],
  ["IE00BGDQ0L74", "XTEC.DE",   "XTEC.DE",   "XETRA",    "Xtrackers MSCI World Information Technology UCITS ETF USD (Acc)", 0.25, "ETF", "Xtrackers", "MSCI World Information Technology",                "Azionari", "Tecnologia"],
  // ── Settore Healthcare ───────────────────────────────────────────────────
  ["IE00B4BNMY34", "HEAL.MI",   "HEAL.MI",   "BIT",      "iShares S&P 500 Health Care Sector UCITS ETF USD (Acc)",   0.15, "ETF", "iShares",   "S&P 500 Health Care",                                      "Azionari", "Healthcare"],
  ["IE00BD4TXV59", "XHCA.DE",   "XHCA.DE",   "XETRA",    "Xtrackers MSCI World Health Care UCITS ETF USD (Acc)",     0.25, "ETF", "Xtrackers", "MSCI World Health Care",                                   "Azionari", "Healthcare"],
  // ── Settore Energia ──────────────────────────────────────────────────────
  ["IE00BGDPWW94", "XENR.DE",   "XENR.DE",   "XETRA",    "Xtrackers MSCI World Energy UCITS ETF USD (Acc)",          0.25, "ETF", "Xtrackers", "MSCI World Energy",                                        "Azionari", "Energia"],
  ["LU0533032776", "NRGG.MI",   "NRGG.MI",   "BIT",      "Lyxor MSCI World Energy TR UCITS ETF USD (Acc)",           0.55, "ETF", "Lyxor",     "MSCI World Energy TR",                                     "Azionari", "Energia"],
  // ── Settore Financials ───────────────────────────────────────────────────
  ["IE00B4WXJK79", "XFIN.DE",   "XFIN.DE",   "XETRA",    "Xtrackers MSCI World Financials UCITS ETF USD (Acc)",      0.25, "ETF", "Xtrackers", "MSCI World Financials",                                    "Azionari", "Finanza"],
  // ── Factor ETFs ──────────────────────────────────────────────────────────
  ["IE00BP3QZ825", "IWMO.L",    "IWMO.L",    "LSE",      "iShares Edge MSCI World Momentum Factor UCITS ETF USD (Acc)", 0.30, "ETF", "iShares",   "MSCI World Momentum",                                   "Azionari", "Factor"],
  ["IE00BP3QZ601", "IWQU.L",    "IWQU.L",    "LSE",      "iShares Edge MSCI World Quality Factor UCITS ETF USD (Acc)", 0.30, "ETF", "iShares",   "MSCI World Quality Factor",                               "Azionari", "Factor"],
  ["IE00BP3QZB59", "IWVL.L",    "IWVL.L",    "LSE",      "iShares Edge MSCI World Value Factor UCITS ETF USD (Acc)", 0.30, "ETF", "iShares",   "MSCI World Value Factor",                                  "Azionari", "Factor"],
  // ── LifeStrategy / Bilanciati ────────────────────────────────────────────
  ["IE00BGSF1X88", "V20A.DE",   "V20A.DE",   "XETRA",    "Vanguard LifeStrategy 20% Equity UCITS ETF EUR (Acc)",     0.25, "ETF", "Vanguard",  "Vanguard LifeStrategy 20% Equity",                         "Bilanciati", "Multi-Asset"],
  ["IE00BMVB5P51", "V40A.DE",   "V40A.DE",   "XETRA",    "Vanguard LifeStrategy 40% Equity UCITS ETF EUR (Acc)",     0.25, "ETF", "Vanguard",  "Vanguard LifeStrategy 40% Equity",                         "Bilanciati", "Multi-Asset"],
  ["IE00BLLZQL78", "V60A.DE",   "V60A.DE",   "XETRA",    "Vanguard LifeStrategy 60% Equity UCITS ETF EUR (Acc)",     0.25, "ETF", "Vanguard",  "Vanguard LifeStrategy 60% Equity",                         "Bilanciati", "Multi-Asset"],
  ["IE00BGDS8G36", "V80A.DE",   "V80A.DE",   "XETRA",    "Vanguard LifeStrategy 80% Equity UCITS ETF EUR (Acc)",     0.25, "ETF", "Vanguard",  "Vanguard LifeStrategy 80% Equity",                         "Bilanciati", "Multi-Asset"],
  // ── ESG ──────────────────────────────────────────────────────────────────
  ["IE00BHZRR030", "SUWS.MI",   "SUWS.MI",   "BIT",      "UBS MSCI World Socially Responsible UCITS ETF USD (Acc)",  0.22, "ETF", "UBS",       "MSCI World SRI",                                           "Azionari", "ESG"],
  ["IE00BYVJRP78", "SUSW.MI",   "SUSW.MI",   "BIT",      "iShares MSCI World SRI UCITS ETF USD (Acc)",               0.20, "ETF", "iShares",   "MSCI World SRI",                                           "Azionari", "ESG"],
  ["IE00BK5BCH80", "LCWL.MI",   "LCWL.MI",   "BIT",      "L&G Clean Energy UCITS ETF USD (Acc)",                     0.49, "ETF", "L&G",       "Solactive Clean Energy",                                   "Azionari", "ESG"],
  // ── Materie Prime ────────────────────────────────────────────────────────
  ["IE00BDFL4P12", "CMOD.MI",   "CMOD.MI",   "BIT",      "iShares Bloomberg Enhanced Roll Commodity Swap UCITS ETF USD (Acc)", 0.19, "ETF", "iShares",   "Bloomberg Commodity",                           "Materie Prime", "Diversificato"],
  ["GB00B15KYG56", "AIGI.MI",   "AIGI.MI",   "BIT",      "WisdomTree Industrial Metals ETC USD",                     0.49, "ETC", "WisdomTree","Bloomberg Industrial Metals",                              "Materie Prime", "Metalli Industriali"],
  // ── Metalli Preziosi / Oro ───────────────────────────────────────────────
  ["IE00B4ND3602", "PPFB.MI",   "PPFB.MI",   "BIT",      "iShares Physical Gold ETC USD",                            0.12, "ETC", "iShares",   "Physical Gold",                                            "Metalli Preziosi", "Oro"],
  ["IE00B579F325", "SGLD.MI",   "SGLD.MI",   "BIT",      "Invesco Physical Gold ETC USD",                            0.12, "ETC", "Invesco",   "Physical Gold",                                            "Metalli Preziosi", "Oro"],
  ["JE00B1VS3770", "PHAU.MI",   "PHAU.MI",   "BIT",      "WisdomTree Physical Gold ETC USD",                         0.39, "ETC", "WisdomTree","Physical Gold",                                            "Metalli Preziosi", "Oro"],
  // ── Cripto (ETP/ETN) ─────────────────────────────────────────────────────
  ["CH1134541153", "BTCE.DE",   "BTCE.DE",   "XETRA",    "ETC Group Physical Bitcoin ETP USD",                       2.00, "ETP", "ETC Group", "Physical Bitcoin",                                         "Criptovalute", "Bitcoin"],
  ["XS2376095068", "VBTC.L",    "VBTC.L",    "LSE",      "VanEck Bitcoin ETN USD",                                   1.00, "ETN", "VanEck",    "Physical Bitcoin",                                         "Criptovalute", "Bitcoin"],
]

// Proxy map: underlyingIndex keyword → yahoo finance proxy ticker
const PROXY_RULES: [string[], string][] = [
  [["s&p 500", "s&p500"],                                       "^GSPC"],
  [["msci world", "ftse all-world", "msci acwi", "lifestrategy"], "^GSPC"],
  [["nasdaq-100", "nasdaq 100", "nasdaq"],                      "^IXIC"],
  [["msci emerging", "ftse emerging", "emerging markets"],      "EEM"],
  [["msci europe", "euro stoxx", "ftse europe", "msci emu"],    "^STOXX50E"],
  [["bloomberg global aggregate", "global aggregate"],          "AGG"],
  [["government bond", "treasury", "euro treasury", "euro government"], "TLT"],
  [["physical gold", "gold"],                                   "GC=F"],
  [["real estate", "reit", "epra"],                             "VNQ"],
  [["high dividend", "dividend"],                               "VYM"],
  [["health care", "health"],                                   "XLV"],
  [["information technology", "technology"],                    "XLK"],
  [["bloomberg commodity", "gsci commodity", "commodit"],       "GSG"],
  [["msci world sri", "sri", "socially responsible", "clean energy"], "^GSPC"],
  [["msci world energy", "oil & gas", "energy"],                "XLE"],
  [["msci world small cap", "small cap"],                       "^GSPC"],
  [["msci world financials", "financials"],                     "^GSPC"],
  [["msci world momentum", "momentum"],                         "^GSPC"],
  [["msci world quality", "quality"],                           "^GSPC"],
  [["msci world value", "value"],                               "^GSPC"],
  [["msci japan", "ftse japan"],                                "EWJ"],
  [["msci pacific"],                                            "EPP"],
]

function detectProxy(index: string): string | null {
  const lower = index.toLowerCase()
  for (const [keywords, proxy] of PROXY_RULES) {
    if (keywords.some(k => lower.includes(k))) return proxy
  }
  return null
}

// AUM in milioni EUR — approssimativi, fonte: siti ufficiali provider (2025)
const AUM_MAP: Record<string, number> = {
  // Azionari Globale
  "SWDA.MI":   70000, "VWCE.DE":  25000, "VWRA.L":   18000, "VWRL.L":    6000,
  "IUSQ.DE":   5000,  "FWRA.MI":   3000, "MEUD.MI":   4000, "LCWD.MI":   1200, "HMWO.L": 3500,
  // S&P 500
  "CSPX.L":   80000,  "SXR8.DE":  90000, "CSP1.MI":  25000, "VUAA.MI":  35000,
  "VUSA.MI":   5000,  "CSX5.DE":   6000, "SPXS.MI":  10000, "LSPU.MI":    900,
  // NASDAQ
  "EQQQ.MI":   7000,  "CNDX.MI":   9000, "LQQ.PA":    5000,
  // Europa
  "SMEA.MI":   5000,  "VEUR.MI":   3500, "LYYS.DE":   2000, "SXRJ.DE":   3000, "EXW1.DE": 9000,
  // Emergenti
  "IS3N.DE":  14000,  "EMIM.MI":   3000, "VFEM.MI":   3000, "SEMA.MI":    700, "AEEM.MI": 3000,
  // Asia
  "IJPA.L":    5000,  "VJPN.MI":   1500, "IASP.L":    2000,
  // Small Cap
  "IUSN.DE":   8000,  "WSML.MI":   1500,
  // Obbligazionari Globali
  "AGGH.MI":   5000,  "VAGF.MI":   2500, "XBAG.DE":   1200,
  // Obbligazionari Governativi
  "IGLT.L":    4000,  "IBTS.MI":   3500, "CSBGE0.DE": 8000, "VETY.MI":   2000,
  "ETLB.MI":   1200,  "IEGE.MI":    500,
  // Corporate
  "EUNA.DE":   8000,  "VCBO.MI":   2500, "IEAA.L":    6000,
  // High Yield
  "IHYG.MI":   6000,  "HYLD.DE":    800,
  // Inflation-Linked
  "IBCI.MI":   4000,  "TIPS.L":    2000,
  // Metalli Preziosi
  "PPFB.MI":  13000,  "SGLD.MI":  14000, "PHAU.MI":   8000,
  // Materie Prime
  "CMOD.MI":    600,  "AIGI.MI":    200,
  // Real Estate
  "IWDP.MI":   3500,  "EPRA.MI":    600, "REIT.MI":   1000,
  // Dividendi
  "IDVY.MI":   1500,  "VHYL.MI":   4000, "ZPRG.DE":   1500,
  // Settoriali
  "QDVE.DE":   2000,  "XTEC.DE":    600, "HEAL.MI":   1000, "XHCA.DE":    500,
  "XENR.DE":    300,  "NRGG.MI":    150, "XFIN.DE":    300,
  // Factor
  "IWMO.L":    3000,  "IWQU.L":    4000, "IWVL.L":    1500,
  // LifeStrategy
  "V20A.DE":   1200,  "V40A.DE":   1800, "V60A.DE":   3000, "V80A.DE":   4500,
  // ESG
  "SUWS.MI":   2500,  "SUSW.MI":   3000, "LCWL.MI":    500,
  // Criptovalute
  "BTCE.DE":    800,  "VBTC.L":     300,
}

// Proxy espliciti per ticker specifici (override)
const PROXY_OVERRIDE: Record<string, string | null> = {
  "PPFB.MI": "GC=F",
  "SGLD.MI": "GC=F",
  "PHAU.MI": "GC=F",
  "IWDP.MI": "VNQ",
  "REIT.MI": "VNQ",
  "IDVY.MI": "VYM",
  "BTCE.DE": null,
  "VBTC.L":  null,
  "AIGI.MI": "GSG",
  "NRGG.MI": "XLE",
}

function dedup(arr: ETFEntry[]): ETFEntry[] {
  const seen = new Set<string>()
  return arr.filter(e => {
    if (seen.has(e.ticker)) return false
    seen.add(e.ticker)
    return true
  })
}

export const ETF_CATALOG: ETFEntry[] = dedup(
  RAW.map(([isin, tickerYF, ticker, exchange, name, ter, type, provider, underlyingIndex, category, subCategory], i) => ({
    id: i + 1,
    isin,
    ticker,
    tickerYF,
    exchange,
    name,
    ter,
    type: type as ETFEntry['type'],
    provider,
    underlyingIndex,
    proxy: PROXY_OVERRIDE.hasOwnProperty(ticker)
      ? PROXY_OVERRIDE[ticker]
      : detectProxy(underlyingIndex),
    category,
    subCategory,
    aum: AUM_MAP[ticker] ?? null,
  }))
)

// Lookup rapidi
export const byTicker = Object.fromEntries(ETF_CATALOG.map(e => [e.ticker, e]))
export const byISIN   = Object.fromEntries(ETF_CATALOG.map(e => [e.isin, e]))

export function searchCatalog(query: string, limit = 8): ETFEntry[] {
  if (!query.trim()) return []
  const q = query.toLowerCase()
  return ETF_CATALOG.filter(e =>
    e.ticker.toLowerCase().includes(q) ||
    e.name.toLowerCase().includes(q) ||
    e.isin.toLowerCase().includes(q) ||
    e.provider.toLowerCase().includes(q)
  ).slice(0, limit)
}

// Restituisce ETF simili per underlyingIndex, ordinati per TER crescente
export function getSuggestedAlternatives(etf: ETFEntry, limit = 3): ETFEntry[] {
  const indexWords = etf.underlyingIndex.toLowerCase().split(' ').filter(w => w.length > 3)

  // Prima priorità: stesso indice esatto
  const exact = ETF_CATALOG.filter(e =>
    e.ticker !== etf.ticker &&
    e.underlyingIndex.toLowerCase() === etf.underlyingIndex.toLowerCase()
  )

  if (exact.length >= limit) {
    return exact.sort((a, b) => a.ter - b.ter).slice(0, limit)
  }

  // Seconda priorità: indice simile (parole chiave in comune)
  const similar = ETF_CATALOG.filter(e =>
    e.ticker !== etf.ticker &&
    e.underlyingIndex.toLowerCase() !== etf.underlyingIndex.toLowerCase() &&
    indexWords.some(w => e.underlyingIndex.toLowerCase().includes(w))
  )

  return [...exact, ...similar]
    .sort((a, b) => a.ter - b.ter)
    .slice(0, limit)
}
