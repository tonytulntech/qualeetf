// Dati di composizione statici per ETF — aggiornati trimestralmente.
// Fonti: MSCI, FTSE Russell, Bloomberg, provider ETF (aprile 2026).
// Per aggiornare: modifica i profili qui sotto, tutto il resto si adatta.

export type GeoItem      = { country: string; pct: number }
export type CurrencyItem = { code: string; name: string; pct: number }

export type CompositionProfile = {
  geography:  GeoItem[]
  currencies: CurrencyItem[]
}

// ── Profili geografici / valutari per indice ─────────────────────────────────

const PROFILES: Record<string, CompositionProfile> = {

  msci_world: {
    geography: [
      { country: 'Stati Uniti',    pct: 71.3 },
      { country: 'Giappone',       pct: 5.6  },
      { country: 'Regno Unito',    pct: 3.8  },
      { country: 'Canada',         pct: 3.5  },
      { country: 'Francia',        pct: 2.5  },
      { country: 'Svizzera',       pct: 2.3  },
      { country: 'Germania',       pct: 2.2  },
      { country: 'Australia',      pct: 1.7  },
      { country: 'Paesi Bassi',    pct: 1.4  },
      { country: 'Danimarca',      pct: 1.3  },
      { country: 'Altri',          pct: 4.4  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',      pct: 71.3 },
      { code: 'EUR', name: 'Euro',             pct: 11.0 },
      { code: 'JPY', name: 'Yen giapponese',   pct: 5.6  },
      { code: 'GBP', name: 'Sterlina',         pct: 3.8  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 3.5  },
      { code: 'CHF', name: 'Franco svizzero',  pct: 2.3  },
      { code: 'AUD', name: 'Dollaro australiano', pct: 1.7 },
      { code: 'DKK', name: 'Corona danese',    pct: 1.3  },
      { code: 'Altri', name: 'Altri',          pct: 0.5  },
    ],
  },

  ftse_all_world: {
    geography: [
      { country: 'Stati Uniti',    pct: 63.5 },
      { country: 'Giappone',       pct: 5.0  },
      { country: 'Cina',           pct: 3.4  },
      { country: 'Regno Unito',    pct: 3.4  },
      { country: 'Canada',         pct: 2.9  },
      { country: 'India',          pct: 2.2  },
      { country: 'Francia',        pct: 2.1  },
      { country: 'Svizzera',       pct: 2.0  },
      { country: 'Germania',       pct: 1.9  },
      { country: 'Taiwan',         pct: 1.9  },
      { country: 'Altri',          pct: 11.7 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',      pct: 63.5 },
      { code: 'EUR', name: 'Euro',             pct: 9.5  },
      { code: 'JPY', name: 'Yen giapponese',   pct: 5.0  },
      { code: 'CNY', name: 'Yuan cinese',      pct: 3.4  },
      { code: 'GBP', name: 'Sterlina',         pct: 3.4  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 2.9  },
      { code: 'INR', name: 'Rupia indiana',    pct: 2.2  },
      { code: 'CHF', name: 'Franco svizzero',  pct: 2.0  },
      { code: 'TWD', name: 'Dollaro taiwanese',pct: 1.9  },
      { code: 'Altri', name: 'Altri',          pct: 6.2  },
    ],
  },

  sp500: {
    geography: [
      { country: 'Stati Uniti', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
  },

  nasdaq100: {
    geography: [
      { country: 'Stati Uniti', pct: 96.8 },
      { country: 'Paesi Bassi', pct: 1.4  },
      { country: 'Regno Unito', pct: 0.9  },
      { country: 'Irlanda',     pct: 0.5  },
      { country: 'Altri',       pct: 0.4  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 96.8 },
      { code: 'EUR', name: 'Euro',        pct: 1.8  },
      { code: 'GBP', name: 'Sterlina',    pct: 0.9  },
      { code: 'Altri', name: 'Altri',     pct: 0.5  },
    ],
  },

  msci_em: {
    geography: [
      { country: 'Cina',          pct: 26.8 },
      { country: 'India',         pct: 18.5 },
      { country: 'Taiwan',        pct: 15.2 },
      { country: 'Corea del Sud', pct: 11.5 },
      { country: 'Brasile',       pct: 5.2  },
      { country: 'Arabia Saudita',pct: 3.1  },
      { country: 'Sudafrica',     pct: 2.8  },
      { country: 'Messico',       pct: 1.9  },
      { country: 'Thailandia',    pct: 1.5  },
      { country: 'Indonesia',     pct: 1.4  },
      { country: 'Altri',         pct: 12.1 },
    ],
    currencies: [
      { code: 'CNY', name: 'Yuan cinese',     pct: 26.8 },
      { code: 'INR', name: 'Rupia indiana',   pct: 18.5 },
      { code: 'TWD', name: 'Dollaro taiwanese', pct: 15.2 },
      { code: 'KRW', name: 'Won sudcoreano',  pct: 11.5 },
      { code: 'BRL', name: 'Real brasiliano', pct: 5.2  },
      { code: 'SAR', name: 'Riyal saudita',   pct: 3.1  },
      { code: 'ZAR', name: 'Rand sudafricano',pct: 2.8  },
      { code: 'Altri', name: 'Altri',         pct: 16.9 },
    ],
  },

  msci_europe: {
    geography: [
      { country: 'Regno Unito', pct: 21.8 },
      { country: 'Francia',     pct: 18.1 },
      { country: 'Germania',    pct: 15.6 },
      { country: 'Svizzera',    pct: 14.8 },
      { country: 'Paesi Bassi', pct: 8.7  },
      { country: 'Svezia',      pct: 5.5  },
      { country: 'Danimarca',   pct: 5.3  },
      { country: 'Spagna',      pct: 3.8  },
      { country: 'Italia',      pct: 2.9  },
      { country: 'Finlandia',   pct: 1.5  },
      { country: 'Altri',       pct: 2.0  },
    ],
    currencies: [
      { code: 'GBP', name: 'Sterlina',       pct: 21.8 },
      { code: 'EUR', name: 'Euro',           pct: 60.8 },
      { code: 'CHF', name: 'Franco svizzero',pct: 14.8 },
      { code: 'SEK', name: 'Corona svedese', pct: 5.5  },
      { code: 'DKK', name: 'Corona danese',  pct: 5.3  },
      { code: 'Altri', name: 'Altri',        pct: 1.8  },
    ],
  },

  euro_stoxx50: {
    geography: [
      { country: 'Francia',     pct: 36.5 },
      { country: 'Germania',    pct: 28.4 },
      { country: 'Paesi Bassi', pct: 12.8 },
      { country: 'Spagna',      pct: 9.2  },
      { country: 'Italia',      pct: 6.1  },
      { country: 'Finlandia',   pct: 3.5  },
      { country: 'Belgio',      pct: 2.0  },
      { country: 'Altri',       pct: 1.5  },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro', pct: 100 },
    ],
  },

  msci_japan: {
    geography: [
      { country: 'Giappone', pct: 100 },
    ],
    currencies: [
      { code: 'JPY', name: 'Yen giapponese', pct: 100 },
    ],
  },

  msci_pacific_exjp: {
    geography: [
      { country: 'Australia',      pct: 60.2 },
      { country: 'Corea del Sud',  pct: 16.1 },
      { country: 'Hong Kong',      pct: 13.8 },
      { country: 'Nuova Zelanda',  pct: 5.7  },
      { country: 'Singapore',      pct: 4.2  },
    ],
    currencies: [
      { code: 'AUD', name: 'Dollaro australiano', pct: 60.2 },
      { code: 'KRW', name: 'Won sudcoreano',      pct: 16.1 },
      { code: 'HKD', name: 'Dollaro hongkonghese',pct: 13.8 },
      { code: 'NZD', name: 'Dollaro neozelandese', pct: 5.7 },
      { code: 'SGD', name: 'Dollaro singaporiano', pct: 4.2 },
    ],
  },

  msci_world_sc: {
    geography: [
      { country: 'Stati Uniti', pct: 59.8 },
      { country: 'Giappone',    pct: 8.1  },
      { country: 'Regno Unito', pct: 6.0  },
      { country: 'Canada',      pct: 5.0  },
      { country: 'Australia',   pct: 4.2  },
      { country: 'Germania',    pct: 3.1  },
      { country: 'Svezia',      pct: 2.9  },
      { country: 'Francia',     pct: 2.5  },
      { country: 'Svizzera',    pct: 2.1  },
      { country: 'Altri',       pct: 6.3  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',      pct: 59.8 },
      { code: 'JPY', name: 'Yen giapponese',   pct: 8.1  },
      { code: 'GBP', name: 'Sterlina',         pct: 6.0  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 5.0  },
      { code: 'EUR', name: 'Euro',             pct: 10.4 },
      { code: 'AUD', name: 'Dollaro australiano', pct: 4.2 },
      { code: 'Altri', name: 'Altri',          pct: 6.5  },
    ],
  },

  global_agg_bond: {
    geography: [
      { country: 'Stati Uniti', pct: 39.2 },
      { country: 'Giappone',    pct: 15.1 },
      { country: 'Francia',     pct: 7.3  },
      { country: 'Germania',    pct: 6.8  },
      { country: 'Regno Unito', pct: 5.9  },
      { country: 'Italia',      pct: 5.2  },
      { country: 'Cina',        pct: 4.8  },
      { country: 'Spagna',      pct: 3.9  },
      { country: 'Canada',      pct: 3.1  },
      { country: 'Altri',       pct: 8.7  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',    pct: 39.2 },
      { code: 'EUR', name: 'Euro',           pct: 26.4 },
      { code: 'JPY', name: 'Yen giapponese', pct: 15.1 },
      { code: 'GBP', name: 'Sterlina',       pct: 5.9  },
      { code: 'CNY', name: 'Yuan cinese',    pct: 4.8  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 3.1 },
      { code: 'Altri', name: 'Altri',        pct: 5.5  },
    ],
  },

  euro_gov_bond: {
    geography: [
      { country: 'Italia',      pct: 25.1 },
      { country: 'Francia',     pct: 22.3 },
      { country: 'Germania',    pct: 20.1 },
      { country: 'Spagna',      pct: 16.4 },
      { country: 'Belgio',      pct: 5.8  },
      { country: 'Paesi Bassi', pct: 5.1  },
      { country: 'Austria',     pct: 2.8  },
      { country: 'Altri',       pct: 2.4  },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro', pct: 100 },
    ],
  },

  euro_corp_bond: {
    geography: [
      { country: 'Francia',     pct: 18.2 },
      { country: 'Germania',    pct: 16.5 },
      { country: 'Regno Unito', pct: 13.1 },
      { country: 'Paesi Bassi', pct: 11.4 },
      { country: 'Italia',      pct: 9.3  },
      { country: 'Spagna',      pct: 7.8  },
      { country: 'Svezia',      pct: 4.2  },
      { country: 'Svizzera',    pct: 3.6  },
      { country: 'Lussemburgo', pct: 3.1  },
      { country: 'Altri',       pct: 12.8 },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro',    pct: 87.2 },
      { code: 'GBP', name: 'Sterlina',pct: 7.8  },
      { code: 'CHF', name: 'Franco svizzero', pct: 3.6 },
      { code: 'Altri', name: 'Altri', pct: 1.4  },
    ],
  },

  epra_nareit_dev: {
    geography: [
      { country: 'Stati Uniti', pct: 65.4 },
      { country: 'Giappone',    pct: 9.8  },
      { country: 'Australia',   pct: 5.6  },
      { country: 'Regno Unito', pct: 4.8  },
      { country: 'Singapore',   pct: 4.1  },
      { country: 'Francia',     pct: 3.2  },
      { country: 'Canada',      pct: 2.9  },
      { country: 'Altri',       pct: 4.2  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',      pct: 65.4 },
      { code: 'JPY', name: 'Yen giapponese',   pct: 9.8  },
      { code: 'AUD', name: 'Dollaro australiano', pct: 5.6 },
      { code: 'GBP', name: 'Sterlina',         pct: 4.8  },
      { code: 'SGD', name: 'Dollaro singaporiano', pct: 4.1 },
      { code: 'EUR', name: 'Euro',             pct: 6.1  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 2.9  },
      { code: 'Altri', name: 'Altri',          pct: 1.3  },
    ],
  },

  epra_nareit_europe: {
    geography: [
      { country: 'Germania',    pct: 25.1 },
      { country: 'Regno Unito', pct: 22.4 },
      { country: 'Francia',     pct: 16.8 },
      { country: 'Svezia',      pct: 12.9 },
      { country: 'Paesi Bassi', pct: 8.7  },
      { country: 'Svizzera',    pct: 5.2  },
      { country: 'Altri',       pct: 8.9  },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro',           pct: 57.1 },
      { code: 'GBP', name: 'Sterlina',       pct: 22.4 },
      { code: 'SEK', name: 'Corona svedese', pct: 12.9 },
      { code: 'CHF', name: 'Franco svizzero',pct: 5.2  },
      { code: 'Altri', name: 'Altri',        pct: 2.4  },
    ],
  },

  physical_gold: {
    geography: [
      { country: 'Globale (oro fisico)', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA (prezzo oro)', pct: 100 },
    ],
  },

  bloomberg_commodity: {
    geography: [
      { country: 'Globale (basket materie prime)', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
  },

  lifestrategy_20: {
    geography: [
      { country: 'Stati Uniti', pct: 14.2 },
      { country: 'Giappone',    pct: 10.8 },
      { country: 'Francia',     pct: 9.1  },
      { country: 'Germania',    pct: 8.3  },
      { country: 'Italia',      pct: 7.2  },
      { country: 'Regno Unito', pct: 6.8  },
      { country: 'Spagna',      pct: 5.9  },
      { country: 'Canada',      pct: 1.4  },
      { country: 'Altri',       pct: 36.3 },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro',           pct: 48.2 },
      { code: 'USD', name: 'Dollaro USA',    pct: 21.3 },
      { code: 'JPY', name: 'Yen giapponese', pct: 10.8 },
      { code: 'GBP', name: 'Sterlina',       pct: 6.8  },
      { code: 'Altri', name: 'Altri',        pct: 12.9 },
    ],
  },

  lifestrategy_80: {
    geography: [
      { country: 'Stati Uniti', pct: 57.2 },
      { country: 'Giappone',    pct: 4.5  },
      { country: 'Francia',     pct: 4.1  },
      { country: 'Germania',    pct: 3.8  },
      { country: 'Regno Unito', pct: 3.5  },
      { country: 'Canada',      pct: 2.8  },
      { country: 'Svizzera',    pct: 1.9  },
      { country: 'Australia',   pct: 1.4  },
      { country: 'Italia',      pct: 2.8  },
      { country: 'Altri',       pct: 18.0 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',    pct: 57.2 },
      { code: 'EUR', name: 'Euro',           pct: 18.5 },
      { code: 'JPY', name: 'Yen giapponese', pct: 4.5  },
      { code: 'GBP', name: 'Sterlina',       pct: 3.5  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 2.8 },
      { code: 'Altri', name: 'Altri',        pct: 13.5 },
    ],
  },

  dividend_global: {
    geography: [
      { country: 'Stati Uniti', pct: 38.1 },
      { country: 'Regno Unito', pct: 11.2 },
      { country: 'Giappone',    pct: 9.4  },
      { country: 'Canada',      pct: 7.8  },
      { country: 'Australia',   pct: 6.9  },
      { country: 'Francia',     pct: 5.2  },
      { country: 'Germania',    pct: 4.1  },
      { country: 'Svizzera',    pct: 3.8  },
      { country: 'Altri',       pct: 13.5 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA',      pct: 38.1 },
      { code: 'GBP', name: 'Sterlina',         pct: 11.2 },
      { code: 'JPY', name: 'Yen giapponese',   pct: 9.4  },
      { code: 'CAD', name: 'Dollaro canadese', pct: 7.8  },
      { code: 'AUD', name: 'Dollaro australiano', pct: 6.9 },
      { code: 'EUR', name: 'Euro',             pct: 16.1 },
      { code: 'CHF', name: 'Franco svizzero',  pct: 3.8  },
      { code: 'Altri', name: 'Altri',          pct: 6.7  },
    ],
  },

  dividend_europe: {
    geography: [
      { country: 'Francia',     pct: 22.1 },
      { country: 'Germania',    pct: 19.3 },
      { country: 'Svezia',      pct: 14.8 },
      { country: 'Paesi Bassi', pct: 12.6 },
      { country: 'Svizzera',    pct: 10.2 },
      { country: 'Spagna',      pct: 8.4  },
      { country: 'Belgio',      pct: 5.9  },
      { country: 'Altri',       pct: 6.7  },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro',           pct: 75.1 },
      { code: 'SEK', name: 'Corona svedese', pct: 14.8 },
      { code: 'CHF', name: 'Franco svizzero',pct: 10.2 },
    ],
  },
}

// ── Mappa ticker → profilo ───────────────────────────────────────────────────
const TICKER_PROFILE: Record<string, string> = {
  // MSCI World
  'SWDA.MI': 'msci_world', 'MEUD.MI': 'msci_world', 'LCWD.MI': 'msci_world',
  'HMWO.L':  'msci_world',
  // FTSE All-World / ACWI
  'IUSQ.DE': 'ftse_all_world',
  'VWCE.DE': 'ftse_all_world', 'VWRA.L': 'ftse_all_world', 'FWRA.MI': 'ftse_all_world',
  // S&P 500
  'CSPX.L': 'sp500', 'SXR8.DE': 'sp500', 'VUAA.MI': 'sp500',
  'CSX5.DE': 'sp500', 'SPXS.MI': 'sp500', 'LSPU.MI': 'sp500',
  'VUSA.MI': 'sp500', 'CSP1.MI': 'sp500',
  // NASDAQ-100
  'EQQQ.MI': 'nasdaq100', 'CNDX.MI': 'nasdaq100', 'LQQ.PA': 'nasdaq100',
  // MSCI Europe / Euro Stoxx
  'SMEA.MI': 'msci_europe', 'VEUR.MI': 'msci_europe', 'LYYS.DE': 'msci_europe',
  'SXRJ.DE': 'euro_stoxx50', 'EXW1.DE': 'euro_stoxx50',
  // Emerging Markets
  'IS3N.DE': 'msci_em', 'EMIM.MI': 'msci_em', 'VFEM.MI': 'msci_em',
  'SEMA.MI': 'msci_em', 'AEEM.MI': 'msci_em',
  // Japan
  'IJPA.L': 'msci_japan', 'VJPN.MI': 'msci_japan',
  // Pacific ex-Japan
  'IASP.L': 'msci_pacific_exjp',
  // Small Cap
  'IUSN.DE': 'msci_world_sc', 'WSML.MI': 'msci_world_sc',
  // Global Aggregate Bond
  'AGGH.MI': 'global_agg_bond', 'VAGF.MI': 'global_agg_bond', 'XBAG.DE': 'global_agg_bond',
  // Euro Government Bond
  'IGLT.L': 'euro_gov_bond', 'IBTS.MI': 'euro_gov_bond',
  'CSBGE0.DE': 'euro_gov_bond', 'VETY.MI': 'euro_gov_bond',
  'ETLB.MI': 'euro_gov_bond', 'IBCI.MI': 'euro_gov_bond',
  'IEGE.MI': 'euro_gov_bond',
  // Euro Corporate Bond
  'EUNA.DE': 'euro_corp_bond', 'VCBO.MI': 'euro_corp_bond',
  'IEAA.L': 'euro_corp_bond', 'IHYG.MI': 'euro_corp_bond',
  'HYLD.DE': 'euro_corp_bond',
  // TIPS
  'TIPS.L': 'sp500',
  // Real Estate
  'IWDP.MI': 'epra_nareit_dev', 'EPRA.MI': 'epra_nareit_dev',
  'REIT.MI': 'epra_nareit_europe',
  // Commodity / Gold
  'PPFB.MI': 'physical_gold', 'SGLD.MI': 'physical_gold', 'PHAU.MI': 'physical_gold',
  'CMOD.MI': 'bloomberg_commodity', 'AIGI.MI': 'bloomberg_commodity',
  // Dividendi
  'VHYL.MI': 'dividend_global', 'GGRP.DE': 'dividend_global',
  'IDVY.MI': 'dividend_europe',
  // Settore Tech / Health / Energy / Financials → US-dominated
  'QDVE.DE': 'sp500', 'XTEC.DE': 'msci_world', 'HEAL.MI': 'sp500',
  'XHCA.DE': 'msci_world', 'XENR.DE': 'msci_world', 'NRGG.MI': 'sp500',
  'XFIN.DE': 'msci_world',
  // Factor ETFs
  'IWMO.L': 'msci_world', 'IWQU.L': 'msci_world', 'IWVL.L': 'msci_world',
  // ESG
  'SUWS.MI': 'msci_world', 'SUSW.MI': 'msci_world', 'LCWL.MI': 'msci_world',
  // LifeStrategy
  'V20A.DE': 'lifestrategy_20', 'V40A.DE': 'lifestrategy_20',
  'V60A.DE': 'lifestrategy_80', 'V80A.DE': 'lifestrategy_80',
}

export function getCompositionProfile(ticker: string): CompositionProfile | null {
  const key = TICKER_PROFILE[ticker]
  return key ? PROFILES[key] ?? null : null
}
