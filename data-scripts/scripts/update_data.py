import os
import sys
import yfinance as yf
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # service_role bypassa RLS

# ETF più usati dagli investitori italiani
ETF_LIST = [
    # Azionari globali
    {"ticker": "SWDA.MI",  "isin": "IE00B4L5Y983", "name": "iShares Core MSCI World",              "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.20, "type": "ETF"},
    {"ticker": "VWCE.DE",  "isin": "IE00BK5BQT80", "name": "Vanguard FTSE All-World Acc",          "provider": "Vanguard", "exchange": "XETRA", "currency": "USD", "ter": 0.22, "type": "ETF"},
    {"ticker": "IWDA.AS",  "isin": "IE00B4L5Y983", "name": "iShares Core MSCI World (AMS)",        "provider": "iShares",  "exchange": "AMS", "currency": "USD", "ter": 0.20, "type": "ETF"},
    {"ticker": "IUSQ.DE",  "isin": "IE00B3YLTY66", "name": "iShares MSCI ACWI",                    "provider": "iShares",  "exchange": "XETRA", "currency": "USD", "ter": 0.20, "type": "ETF"},
    {"ticker": "FWRA.MI",  "isin": "IE00B3RBWM25", "name": "Invesco FTSE All-World",               "provider": "Invesco",  "exchange": "BIT", "currency": "USD", "ter": 0.15, "type": "ETF"},

    # Azionari USA
    {"ticker": "CSPX.L",   "isin": "IE00B5BMR087", "name": "iShares Core S&P 500",                 "provider": "iShares",  "exchange": "LSE", "currency": "USD", "ter": 0.07, "type": "ETF"},
    {"ticker": "SXR8.DE",  "isin": "IE00B5BMR087", "name": "iShares Core S&P 500 (XETRA)",         "provider": "iShares",  "exchange": "XETRA", "currency": "USD", "ter": 0.07, "type": "ETF"},
    {"ticker": "VUAA.MI",  "isin": "IE00BFMXXD54", "name": "Vanguard S&P 500 Acc",                 "provider": "Vanguard", "exchange": "BIT", "currency": "USD", "ter": 0.07, "type": "ETF"},
    {"ticker": "EQQQ.MI",  "isin": "IE0032077012", "name": "Invesco NASDAQ-100",                   "provider": "Invesco",  "exchange": "BIT", "currency": "USD", "ter": 0.30, "type": "ETF"},

    # Azionari emergenti
    {"ticker": "IS3N.DE",  "isin": "IE00BKM4GZ66", "name": "iShares Core MSCI EM IMI",             "provider": "iShares",  "exchange": "XETRA", "currency": "USD", "ter": 0.18, "type": "ETF"},
    {"ticker": "VFEM.MI",  "isin": "IE00B3VVMM84", "name": "Vanguard FTSE Emerging Markets",       "provider": "Vanguard", "exchange": "BIT", "currency": "USD", "ter": 0.22, "type": "ETF"},

    # Azionari Europa
    {"ticker": "SMEA.MI",  "isin": "IE00B4K48X80", "name": "iShares Core MSCI Europe",             "provider": "iShares",  "exchange": "BIT", "currency": "EUR", "ter": 0.12, "type": "ETF"},
    {"ticker": "VEUR.MI",  "isin": "IE00B945VV12", "name": "Vanguard FTSE Developed Europe",       "provider": "Vanguard", "exchange": "BIT", "currency": "EUR", "ter": 0.10, "type": "ETF"},

    # Obbligazionari
    {"ticker": "AGGH.MI",  "isin": "IE00BDBRDM35", "name": "iShares Core Global Aggregate Bond",   "provider": "iShares",  "exchange": "BIT", "currency": "EUR", "ter": 0.10, "type": "ETF"},
    {"ticker": "VAGF.MI",  "isin": "IE00BG47KB92", "name": "Vanguard Global Aggregate Bond",       "provider": "Vanguard", "exchange": "BIT", "currency": "EUR", "ter": 0.10, "type": "ETF"},
    {"ticker": "IBCI.MI",  "isin": "IE00B3VTMJ91", "name": "iShares EUR Govt Bond 7-10yr",         "provider": "iShares",  "exchange": "BIT", "currency": "EUR", "ter": 0.09, "type": "ETF"},
    {"ticker": "XGLE.MI",  "isin": "LU0290358497", "name": "Xtrackers Eurozone Gov Bond",          "provider": "Xtrackers","exchange": "BIT", "currency": "EUR", "ter": 0.15, "type": "ETF"},

    # Azionari fattoriali / smart beta
    {"ticker": "IWMO.MI",  "isin": "IE00B3RBWM25", "name": "iShares Edge MSCI World Momentum",     "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.30, "type": "ETF"},
    {"ticker": "IWQU.MI",  "isin": "IE00BDB2FX72", "name": "iShares Edge MSCI World Quality",      "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.30, "type": "ETF"},
    {"ticker": "MVOL.MI",  "isin": "IE00B8FHGS14", "name": "iShares Edge MSCI World Min Vol",      "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.30, "type": "ETF"},

    # Settoriali
    {"ticker": "QDVE.DE",  "isin": "IE00B3WJKG14", "name": "iShares S&P 500 IT Sector",            "provider": "iShares",  "exchange": "XETRA", "currency": "USD", "ter": 0.15, "type": "ETF"},
    {"ticker": "HEAL.MI",  "isin": "IE00B3VWM344", "name": "iShares S&P 500 Healthcare Sector",    "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.15, "type": "ETF"},

    # Materie prime
    {"ticker": "IGLN.L",   "isin": "IE00B4MCHH79", "name": "iShares Physical Gold",                "provider": "iShares",  "exchange": "LSE", "currency": "USD", "ter": 0.12, "type": "ETC"},
    {"ticker": "SGLD.MI",  "isin": "IE00B579F325", "name": "Invesco Physical Gold",                 "provider": "Invesco",  "exchange": "BIT", "currency": "USD", "ter": 0.12, "type": "ETC"},

    # Immobiliare
    {"ticker": "IWDP.MI",  "isin": "IE00B1FZS350", "name": "iShares Developed World Property",     "provider": "iShares",  "exchange": "BIT", "currency": "USD", "ter": 0.59, "type": "ETF"},

    # Dividendi
    {"ticker": "VHYL.MI",  "isin": "IE00B8GKDB10", "name": "Vanguard FTSE All-World High Div",     "provider": "Vanguard", "exchange": "BIT", "currency": "USD", "ter": 0.29, "type": "ETF"},
    {"ticker": "IDVY.MI",  "isin": "IE0031442068",  "name": "iShares Euro Dividend",                "provider": "iShares",  "exchange": "BIT", "currency": "EUR", "ter": 0.40, "type": "ETF"},

    # Portafogli bilanciati (lifestrategy)
    {"ticker": "V80A.DE",  "isin": "IE00BMVB5P51", "name": "Vanguard LifeStrategy 80% Equity",     "provider": "Vanguard", "exchange": "XETRA", "currency": "EUR", "ter": 0.25, "type": "ETF"},
    {"ticker": "V60A.DE",  "isin": "IE00BMVB5R75", "name": "Vanguard LifeStrategy 60% Equity",     "provider": "Vanguard", "exchange": "XETRA", "currency": "EUR", "ter": 0.25, "type": "ETF"},
    {"ticker": "V40A.DE",  "isin": "IE00BMVB5S82", "name": "Vanguard LifeStrategy 40% Equity",     "provider": "Vanguard", "exchange": "XETRA", "currency": "EUR", "ter": 0.25, "type": "ETF"},
    {"ticker": "V20A.DE",  "isin": "IE00BMVB5T99", "name": "Vanguard LifeStrategy 20% Equity",     "provider": "Vanguard", "exchange": "XETRA", "currency": "EUR", "ter": 0.25, "type": "ETF"},
]


def get_supabase():
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("❌ Configura SUPABASE_URL e SUPABASE_KEY nel file .env")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def upsert_instruments(supabase):
    print("\n📋 Carico anagrafica ETF...")
    errors = []

    for etf in ETF_LIST:
        try:
            # Prende la data di inizio dati da yfinance
            info = yf.Ticker(etf["ticker"]).history(period="max")
            inception = str(info.index[0].date()) if not info.empty else None

            row = {
                "ticker":         etf["ticker"],
                "isin":           etf["isin"],
                "name":           etf["name"],
                "type":           etf["type"],
                "provider":       etf["provider"],
                "exchange":       etf["exchange"],
                "currency":       etf["currency"],
                "ter":            etf["ter"],
                "inception_date": inception,
                "is_active":      True,
            }

            supabase.table("instruments").upsert(
                row, on_conflict="ticker,exchange"
            ).execute()
            print(f"  ✅ {etf['ticker']} — {etf['name']}")

        except Exception as e:
            msg = f"{etf['ticker']}: {str(e)}"
            errors.append(msg)
            print(f"  ⚠️  {msg}")

    return errors


def upsert_prices(supabase):
    print("\n📈 Scarico prezzi storici...")
    errors = []

    # Recupera tutti gli instrument_id dal DB
    result = supabase.table("instruments").select("id, ticker").execute()
    instruments = {row["ticker"]: row["id"] for row in result.data}

    for etf in ETF_LIST:
        ticker = etf["ticker"]
        instrument_id = instruments.get(ticker)
        if not instrument_id:
            errors.append(f"{ticker}: non trovato nel DB")
            continue

        try:
            df = yf.download(ticker, period="max", interval="1d", progress=False, auto_adjust=True)

            if df.empty:
                errors.append(f"{ticker}: nessun dato da yfinance")
                continue

            # Appiattisce MultiIndex se presente
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)

            rows = []
            for date, row in df.iterrows():
                close_val = row.get("Close")
                if pd.isna(close_val):
                    continue
                rows.append({
                    "instrument_id": instrument_id,
                    "date":          str(date.date()),
                    "open":          round(float(row["Open"]), 4) if not pd.isna(row.get("Open")) else None,
                    "high":          round(float(row["High"]), 4) if not pd.isna(row.get("High")) else None,
                    "low":           round(float(row["Low"]),  4) if not pd.isna(row.get("Low"))  else None,
                    "close":         round(float(close_val), 4),
                    "volume":        int(row["Volume"]) if not pd.isna(row.get("Volume")) else None,
                })

            # Upsert a blocchi di 500 righe
            for i in range(0, len(rows), 500):
                supabase.table("prices").upsert(
                    rows[i:i+500], on_conflict="instrument_id,date"
                ).execute()

            print(f"  ✅ {ticker} — {len(rows)} righe")

        except Exception as e:
            msg = f"{ticker}: {str(e)}"
            errors.append(msg)
            print(f"  ⚠️  {msg}")

    return errors


def main():
    print("=" * 50)
    print("  CheEtf — Aggiornamento dati")
    print(f"  {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 50)

    supabase = get_supabase()

    errors_instruments = upsert_instruments(supabase)
    errors_prices      = upsert_prices(supabase)

    all_errors = errors_instruments + errors_prices

    print("\n" + "=" * 50)
    if all_errors:
        print(f"⚠️  Completato con {len(all_errors)} errori:")
        for e in all_errors:
            print(f"   - {e}")
    else:
        print("✅ Tutto aggiornato senza errori!")
    print("=" * 50)


if __name__ == "__main__":
    main()
