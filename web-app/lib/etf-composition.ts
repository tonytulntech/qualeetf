// Dati di composizione statici per ETF — aggiornati trimestralmente.
// Fonti: MSCI, FTSE Russell, Bloomberg, provider ETF (aprile 2026).
// Per aggiornare: modifica i profili qui sotto, tutto il resto si adatta.

export type GeoItem      = { country: string; pct: number }
export type CurrencyItem = { code: string; name: string; pct: number }
export type HoldingItem  = { name: string; pct: number }

export type CompositionProfile = {
  geography:    GeoItem[]
  currencies:   CurrencyItem[]
  topHoldings?: HoldingItem[]
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
    topHoldings: [
      { name: 'Apple',           pct: 4.8 },
      { name: 'NVIDIA',          pct: 4.5 },
      { name: 'Microsoft',       pct: 4.4 },
      { name: 'Amazon',          pct: 2.7 },
      { name: 'Meta Platforms',  pct: 2.2 },
      { name: 'Alphabet A',      pct: 1.8 },
      { name: 'Alphabet C',      pct: 1.6 },
      { name: 'Broadcom',        pct: 1.5 },
      { name: 'Tesla',           pct: 1.2 },
      { name: 'JPMorgan Chase',  pct: 1.2 },
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
    topHoldings: [
      { name: 'Apple',           pct: 3.9 },
      { name: 'NVIDIA',          pct: 3.7 },
      { name: 'Microsoft',       pct: 3.6 },
      { name: 'Amazon',          pct: 2.3 },
      { name: 'Meta Platforms',  pct: 1.8 },
      { name: 'Alphabet A',      pct: 1.5 },
      { name: 'Alphabet C',      pct: 1.4 },
      { name: 'Broadcom',        pct: 1.3 },
      { name: 'Tesla',           pct: 1.0 },
      { name: 'JPMorgan Chase',  pct: 1.0 },
    ],
  },

  sp500: {
    geography: [
      { country: 'Stati Uniti', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
    topHoldings: [
      { name: 'Apple',           pct: 6.7 },
      { name: 'NVIDIA',          pct: 6.5 },
      { name: 'Microsoft',       pct: 6.0 },
      { name: 'Amazon',          pct: 3.8 },
      { name: 'Meta Platforms',  pct: 2.9 },
      { name: 'Alphabet A',      pct: 2.4 },
      { name: 'Broadcom',        pct: 2.3 },
      { name: 'Alphabet C',      pct: 2.2 },
      { name: 'Tesla',           pct: 1.8 },
      { name: 'JPMorgan Chase',  pct: 1.6 },
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
    topHoldings: [
      { name: 'Apple',           pct: 8.5 },
      { name: 'NVIDIA',          pct: 8.1 },
      { name: 'Microsoft',       pct: 7.7 },
      { name: 'Amazon',          pct: 5.1 },
      { name: 'Meta Platforms',  pct: 4.6 },
      { name: 'Broadcom',        pct: 3.4 },
      { name: 'Alphabet A',      pct: 3.3 },
      { name: 'Alphabet C',      pct: 3.1 },
      { name: 'Tesla',           pct: 2.4 },
      { name: 'Costco',          pct: 1.4 },
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
    topHoldings: [
      { name: 'TSMC',              pct: 8.7 },
      { name: 'Tencent',           pct: 4.5 },
      { name: 'Samsung Electronics',pct: 3.2 },
      { name: 'Alibaba',           pct: 2.9 },
      { name: 'Meituan',           pct: 1.9 },
      { name: 'Reliance Industries',pct: 1.6 },
      { name: 'Infosys',           pct: 1.3 },
      { name: 'HDFC Bank',         pct: 1.2 },
      { name: 'Xiaomi',            pct: 1.1 },
      { name: 'Vale',              pct: 1.0 },
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
    topHoldings: [
      { name: 'ASML Holding',    pct: 4.5 },
      { name: 'Nestlé',          pct: 3.2 },
      { name: 'Novo Nordisk',    pct: 3.1 },
      { name: 'LVMH',            pct: 2.8 },
      { name: 'SAP',             pct: 2.5 },
      { name: 'Roche',           pct: 2.3 },
      { name: 'Novartis',        pct: 2.1 },
      { name: 'Shell',           pct: 2.0 },
      { name: 'AstraZeneca',     pct: 1.9 },
      { name: 'HSBC',            pct: 1.8 },
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
    topHoldings: [
      { name: 'ASML Holding',        pct: 8.9 },
      { name: 'LVMH',                pct: 5.2 },
      { name: 'SAP',                 pct: 5.0 },
      { name: 'TotalEnergies',       pct: 4.5 },
      { name: 'Siemens',             pct: 4.2 },
      { name: 'Sanofi',              pct: 3.7 },
      { name: 'Schneider Electric',  pct: 3.6 },
      { name: 'Airbus',              pct: 3.5 },
      { name: 'BNP Paribas',         pct: 3.2 },
      { name: 'Allianz',             pct: 3.0 },
    ],
  },

  msci_japan: {
    geography: [
      { country: 'Giappone', pct: 100 },
    ],
    currencies: [
      { code: 'JPY', name: 'Yen giapponese', pct: 100 },
    ],
    topHoldings: [
      { name: 'Toyota Motor',     pct: 4.1 },
      { name: 'Sony Group',       pct: 2.8 },
      { name: 'Mitsubishi UFJ',   pct: 2.3 },
      { name: 'Hitachi',          pct: 2.1 },
      { name: 'Keyence',          pct: 1.9 },
      { name: 'Sumitomo Mitsui',  pct: 1.7 },
      { name: 'Tokyo Electron',   pct: 1.6 },
      { name: 'Recruit Holdings', pct: 1.5 },
      { name: 'SoftBank Group',   pct: 1.4 },
      { name: 'Fast Retailing',   pct: 1.3 },
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

  // ── USD Treasury (generico — tutte le scadenze) ──────────────────────────
  usd_treasury: {
    geography: [
      { country: 'Stati Uniti', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
    topHoldings: [
      { name: 'US Treasury 4.500% 2033', pct: 3.8 },
      { name: 'US Treasury 4.375% 2031', pct: 3.5 },
      { name: 'US Treasury 4.250% 2034', pct: 3.3 },
      { name: 'US Treasury 3.875% 2030', pct: 3.1 },
      { name: 'US Treasury 4.000% 2032', pct: 2.9 },
      { name: 'US Treasury 3.750% 2026', pct: 2.7 },
      { name: 'US Treasury 4.625% 2026', pct: 2.5 },
      { name: 'US Treasury 4.000% 2027', pct: 2.3 },
      { name: 'US Treasury 3.500% 2028', pct: 2.1 },
      { name: 'Altri Treasury',          pct: 73.8 },
    ],
  },

  // ── USD Treasury 20+ anni ────────────────────────────────────────────────
  usd_treasury_long: {
    geography: [
      { country: 'Stati Uniti', pct: 100 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
    topHoldings: [
      { name: 'US Treasury 4.375% 2043', pct: 6.2 },
      { name: 'US Treasury 4.125% 2044', pct: 5.8 },
      { name: 'US Treasury 3.625% 2053', pct: 5.4 },
      { name: 'US Treasury 4.750% 2041', pct: 4.9 },
      { name: 'US Treasury 3.000% 2047', pct: 4.6 },
      { name: 'US Treasury 2.875% 2046', pct: 4.2 },
      { name: 'US Treasury 2.250% 2052', pct: 3.8 },
      { name: 'US Treasury 1.875% 2051', pct: 3.5 },
      { name: 'US Treasury 4.000% 2042', pct: 3.3 },
      { name: 'Altri Treasury 20+ anni', pct: 58.3 },
    ],
  },

  // ── USD Corporate Bond ───────────────────────────────────────────────────
  usd_corp_bond: {
    geography: [
      { country: 'Stati Uniti',    pct: 84.3 },
      { country: 'Regno Unito',    pct: 4.8  },
      { country: 'Canada',         pct: 3.1  },
      { country: 'Paesi Bassi',    pct: 2.4  },
      { country: 'Francia',        pct: 2.2  },
      { country: 'Giappone',       pct: 1.2  },
      { country: 'Altri',          pct: 2.0  },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
    topHoldings: [
      { name: 'Apple 3.85% 2043',          pct: 0.6 },
      { name: 'JPMorgan Chase 3.702% 2030', pct: 0.5 },
      { name: 'Bank of America 4.375% 2033',pct: 0.5 },
      { name: 'Microsoft 3.45% 2036',       pct: 0.4 },
      { name: 'Goldman Sachs 4.40% 2032',   pct: 0.4 },
      { name: 'Wells Fargo 4.478% 2039',    pct: 0.4 },
      { name: 'AT&T 3.65% 2051',            pct: 0.3 },
      { name: 'Verizon 3.55% 2051',         pct: 0.3 },
      { name: 'Amazon 3.875% 2038',         pct: 0.3 },
      { name: 'Altri obbligazioni corp.',   pct: 96.3 },
    ],
  },

  // ── EM Bond Hard Currency (USD) ──────────────────────────────────────────
  em_bond_hard: {
    geography: [
      { country: 'Messico',     pct: 7.8  },
      { country: 'Indonesia',   pct: 7.2  },
      { country: 'Arabia Saudita', pct: 6.4 },
      { country: 'Turchia',     pct: 5.9  },
      { country: 'Brasile',     pct: 5.6  },
      { country: 'Cina',        pct: 5.1  },
      { country: 'Colombia',    pct: 3.8  },
      { country: 'Filippine',   pct: 3.5  },
      { country: 'Sudafrica',   pct: 3.2  },
      { country: 'Romania',     pct: 2.9  },
      { country: 'Ungheria',    pct: 2.7  },
      { country: 'Polonia',     pct: 2.5  },
      { country: 'Altri',       pct: 43.4 },
    ],
    currencies: [
      { code: 'USD', name: 'Dollaro USA', pct: 100 },
    ],
  },

  // ── EM Bond Local Currency ───────────────────────────────────────────────
  em_bond_local: {
    geography: [
      { country: 'Brasile',     pct: 10.2 },
      { country: 'Messico',     pct: 9.8  },
      { country: 'Indonesia',   pct: 8.6  },
      { country: 'Cina',        pct: 7.9  },
      { country: 'India',       pct: 7.2  },
      { country: 'Sudafrica',   pct: 5.8  },
      { country: 'Polonia',     pct: 5.1  },
      { country: 'Malesia',     pct: 4.4  },
      { country: 'Tailandia',   pct: 3.9  },
      { country: 'Ungheria',    pct: 3.5  },
      { country: 'Colombia',    pct: 3.2  },
      { country: 'Rep. Ceca',   pct: 2.8  },
      { country: 'Altri',       pct: 27.6 },
    ],
    currencies: [
      { code: 'BRL', name: 'Real brasiliano',  pct: 10.2 },
      { code: 'MXN', name: 'Peso messicano',   pct: 9.8  },
      { code: 'IDR', name: 'Rupia indonesiana',pct: 8.6  },
      { code: 'CNY', name: 'Yuan cinese',      pct: 7.9  },
      { code: 'INR', name: 'Rupia indiana',    pct: 7.2  },
      { code: 'ZAR', name: 'Rand sudafricano', pct: 5.8  },
      { code: 'PLN', name: 'Zloty polacco',    pct: 5.1  },
      { code: 'MYR', name: 'Ringgit malese',   pct: 4.4  },
      { code: 'THB', name: 'Baht tailandese',  pct: 3.9  },
      { code: 'Altri', name: 'Altri',          pct: 37.1 },
    ],
  },

  // ── Green Bond Globale (EUR Hedged) ──────────────────────────────────────
  green_bond_global: {
    geography: [
      { country: 'Supranazionale',  pct: 19.4 },
      { country: 'Germania',        pct: 12.8 },
      { country: 'Francia',         pct: 11.6 },
      { country: 'Stati Uniti',     pct: 10.2 },
      { country: 'Paesi Bassi',     pct: 8.4  },
      { country: 'Spagna',          pct: 6.1  },
      { country: 'Svezia',          pct: 5.3  },
      { country: 'Italia',          pct: 4.8  },
      { country: 'Danimarca',       pct: 3.9  },
      { country: 'Belgio',          pct: 3.2  },
      { country: 'Altri',           pct: 14.3 },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro (hedged)',     pct: 72.4 },
      { code: 'USD', name: 'Dollaro USA',       pct: 10.2 },
      { code: 'SEK', name: 'Corona svedese',    pct: 5.3  },
      { code: 'Altri', name: 'Altri (hedged)',  pct: 12.1 },
    ],
  },

  // ── Ultra-Short / Monetario EUR ──────────────────────────────────────────
  ultra_short_eur: {
    geography: [
      { country: 'Germania',    pct: 28.4 },
      { country: 'Francia',     pct: 22.1 },
      { country: 'Italia',      pct: 17.6 },
      { country: 'Spagna',      pct: 12.3 },
      { country: 'Paesi Bassi', pct: 8.2  },
      { country: 'Belgio',      pct: 5.6  },
      { country: 'Austria',     pct: 3.2  },
      { country: 'Altri',       pct: 2.6  },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro', pct: 100 },
    ],
    topHoldings: [
      { name: 'BEI / Cassa Depositi Prestiti', pct: 18.3 },
      { name: 'German T-Bill 0.00% 2025',      pct: 8.6  },
      { name: 'French OAT 0.00% 2025',         pct: 7.9  },
      { name: 'Italian BOT 0.00% 2025',        pct: 6.8  },
      { name: 'Spanish LETRAS 0.00% 2025',     pct: 5.5  },
      { name: 'Depositi overnight BCE (€STR)', pct: 52.9 },
    ],
  },

  // ── Overnight / EONIA (puro tasso BCE) ───────────────────────────────────
  overnight_eur: {
    geography: [
      { country: 'Eurozona', pct: 100 },
    ],
    currencies: [
      { code: 'EUR', name: 'Euro', pct: 100 },
    ],
    topHoldings: [
      { name: 'Depositi overnight interbancari BCE (€STR)', pct: 100 },
    ],
  },

  // ── Crypto spot: Bitcoin ──────────────────────────────────────────────────
  bitcoin_spot: {
    geography: [],
    currencies: [
      { code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 },
    ],
    topHoldings: [
      { name: 'Bitcoin (BTC)', pct: 100 },
    ],
  },

  // ── Crypto spot: Ethereum ─────────────────────────────────────────────────
  ethereum_spot: {
    geography: [],
    currencies: [
      { code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 },
    ],
    topHoldings: [
      { name: 'Ethereum (ETH)', pct: 100 },
    ],
  },

  // ── Crypto spot: BNB ─────────────────────────────────────────────────────
  bnb_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'BNB – Binance Coin', pct: 100 }],
  },

  // ── Crypto spot: Solana ───────────────────────────────────────────────────
  solana_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Solana (SOL)', pct: 100 }],
  },

  // ── Crypto spot: XRP ─────────────────────────────────────────────────────
  xrp_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'XRP – Ripple', pct: 100 }],
  },

  // ── Crypto spot: Cardano ──────────────────────────────────────────────────
  cardano_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Cardano (ADA)', pct: 100 }],
  },

  // ── Crypto spot: Avalanche ────────────────────────────────────────────────
  avax_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Avalanche (AVAX)', pct: 100 }],
  },

  // ── Crypto spot: Dogecoin ─────────────────────────────────────────────────
  doge_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Dogecoin (DOGE)', pct: 100 }],
  },

  // ── Crypto spot: Chainlink ────────────────────────────────────────────────
  link_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Chainlink (LINK)', pct: 100 }],
  },

  // ── Crypto spot: Polkadot ─────────────────────────────────────────────────
  dot_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Polkadot (DOT)', pct: 100 }],
  },

  // ── Crypto spot: Polygon ──────────────────────────────────────────────────
  matic_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Polygon (MATIC/POL)', pct: 100 }],
  },

  // ── Crypto spot: Uniswap ──────────────────────────────────────────────────
  uni_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Uniswap (UNI)', pct: 100 }],
  },

  // ── Crypto spot: Litecoin ─────────────────────────────────────────────────
  ltc_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'Litecoin (LTC)', pct: 100 }],
  },

  // ── Crypto spot: NEAR Protocol ────────────────────────────────────────────
  near_spot: {
    geography: [],
    currencies: [{ code: 'USD', name: 'Dollaro USA (quotazione)', pct: 100 }],
    topHoldings: [{ name: 'NEAR Protocol', pct: 100 }],
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
  // TIPS / Inflation-Linked
  'TIPS.L': 'usd_treasury',
  // USD Treasury
  'IDTL.L':  'usd_treasury_long', 'DTLA.L':  'usd_treasury',
  'IBTM.L':  'usd_treasury',      'IBTU.L':  'usd_treasury',
  'VDTY.L':  'usd_treasury',
  // USD Corporate
  'LQDA.L':  'usd_corp_bond', 'VUCP.MI': 'usd_corp_bond', 'LQDE.L': 'usd_corp_bond',
  // EM Bond
  'SEML.MI': 'em_bond_hard',  'VDEM.L':  'em_bond_hard',
  'EMBE.MI': 'em_bond_local',
  // Green Bond
  'CLMA.MI': 'green_bond_global',
  // Ultra-Short
  'IBGS.L':  'ultra_short_eur',
  'XEON.DE': 'overnight_eur', 'CSH2.PA': 'overnight_eur',
  // Crypto ETP (già esistenti)
  'BTCE.DE': 'bitcoin_spot',  'VBTC.L':  'bitcoin_spot',
  // Crypto spot
  'BTC-USD':  'bitcoin_spot',  'ETH-USD':  'ethereum_spot',
  'BNB-USD':  'bnb_spot',      'SOL-USD':  'solana_spot',
  'XRP-USD':  'xrp_spot',      'ADA-USD':  'cardano_spot',
  'AVAX-USD': 'avax_spot',     'DOGE-USD': 'doge_spot',
  'LINK-USD': 'link_spot',     'DOT-USD':  'dot_spot',
  'MATIC-USD':'matic_spot',    'UNI-USD':  'uni_spot',
  'LTC-USD':  'ltc_spot',      'NEAR-USD': 'near_spot',
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

// ── Duration media ponderata per ETF obbligazionario (anni) ──────────────────
// Modified duration ≈ prezzo % cambia di -duration% per ogni +1% dei tassi.
export const BOND_DURATION_MAP: Record<string, number> = {
  // ── Globali ────────────────────────────────────────────────────────────────
  'AGGH.MI':   6.8, 'VAGF.MI':   6.8, 'XBAG.DE':  6.8,
  // ── Euro Governativi ───────────────────────────────────────────────────────
  'IGLT.L':   14.2,                              // UK Gilts all maturities
  'IBTS.MI':   1.9,                              // Euro Gov 1-3yr
  'CSBGE0.DE': 7.5, 'VETY.MI':  7.5, 'ETLB.MI': 7.5, 'IEGE.MI': 7.5,
  'IBCI.MI':   8.1,                              // Inflation-linked
  'TIPS.L':    7.2,                              // USD TIPS
  // ── USD Governativi ────────────────────────────────────────────────────────
  'IDTL.L':   17.8,                              // 20+yr Treasury
  'DTLA.L':    8.2,                              // 7-10yr Treasury
  'IBTM.L':    4.8,                              // 3-7yr Treasury
  'IBTU.L':    0.4,                              // 0-1yr Treasury
  'VDTY.L':    6.5,                              // USD Treasury tutte scadenze
  // ── Euro Corporate ─────────────────────────────────────────────────────────
  'EUNA.DE':   5.2, 'VCBO.MI':  5.2, 'IEAA.L':  5.2,
  // ── High Yield ─────────────────────────────────────────────────────────────
  'IHYG.MI':   3.8, 'HYLD.DE':  3.8,
  // ── USD Corporate ──────────────────────────────────────────────────────────
  'LQDA.L':    7.1, 'VUCP.MI':  7.1, 'LQDE.L':  7.1,
  // ── Emergenti ──────────────────────────────────────────────────────────────
  'SEML.MI':   7.3, 'VDEM.L':   6.8,            // hard currency
  'EMBE.MI':   5.8,                              // local currency
  // ── ESG Bond ───────────────────────────────────────────────────────────────
  'CLMA.MI':   7.2,
  // ── Ultra-Short ────────────────────────────────────────────────────────────
  'IBGS.L':    1.9,                              // Euro Gov 1-3yr Dist
  'XEON.DE':   0.003,                            // overnight
  'CSH2.PA':   0.003,                            // overnight
}

export function getBondDuration(ticker: string): number | null {
  return BOND_DURATION_MAP[ticker] ?? null
}
