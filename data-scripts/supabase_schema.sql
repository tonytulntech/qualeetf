-- CheEtf.com — Schema Database
-- Incolla tutto questo nell'SQL Editor di Supabase

-- Anagrafica strumenti (ETF, stock, ETC, ETN)
CREATE TABLE instruments (
    id SERIAL PRIMARY KEY,
    ticker TEXT NOT NULL,
    isin TEXT,
    name TEXT NOT NULL,
    type TEXT,              -- 'ETF', 'STOCK', 'ETC', 'ETN'
    provider TEXT,          -- 'iShares', 'Vanguard', 'Amundi'...
    exchange TEXT,          -- 'BIT', 'XETRA', 'NYSE'...
    currency TEXT,
    ter DECIMAL,            -- Total Expense Ratio
    inception_date DATE,    -- "Dati dal"
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ticker, exchange)
);

-- Prezzi storici EOD
CREATE TABLE prices (
    id SERIAL PRIMARY KEY,
    instrument_id INTEGER REFERENCES instruments(id),
    date DATE NOT NULL,
    open DECIMAL,
    high DECIMAL,
    low DECIMAL,
    close DECIMAL NOT NULL,
    volume BIGINT,
    UNIQUE(instrument_id, date)
);

-- Holdings ETF (cosa contiene ogni ETF)
CREATE TABLE etf_holdings (
    id SERIAL PRIMARY KEY,
    etf_id INTEGER REFERENCES instruments(id),
    holding_name TEXT,
    holding_ticker TEXT,
    isin TEXT,
    weight_pct DECIMAL,
    country TEXT,
    sector TEXT,
    currency TEXT,
    asset_class TEXT,
    snapshot_date DATE,
    UNIQUE(etf_id, isin, snapshot_date)
);

-- Statistiche aggregate ETF (pre-calcolate per velocità)
CREATE TABLE etf_stats (
    id SERIAL PRIMARY KEY,
    etf_id INTEGER REFERENCES instruments(id),
    stat_type TEXT,         -- 'country', 'sector', 'currency'
    label TEXT,
    weight_pct DECIMAL,
    snapshot_date DATE,
    UNIQUE(etf_id, stat_type, label, snapshot_date)
);

-- Dividendi
CREATE TABLE dividends (
    id SERIAL PRIMARY KEY,
    instrument_id INTEGER REFERENCES instruments(id),
    ex_date DATE,
    pay_date DATE,
    amount DECIMAL,
    currency TEXT,
    UNIQUE(instrument_id, ex_date)
);

-- Indice per query veloci sui prezzi
CREATE INDEX idx_prices_instrument_date ON prices(instrument_id, date DESC);
CREATE INDEX idx_prices_date ON prices(date DESC);
CREATE INDEX idx_holdings_etf ON etf_holdings(etf_id, snapshot_date DESC);
CREATE INDEX idx_stats_etf ON etf_stats(etf_id, snapshot_date DESC);
