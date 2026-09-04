# ingest.py
from dotenv import load_dotenv
load_dotenv()

import yfinance as yf
import time
from ssl_setup import create_supabase_client

sb = create_supabase_client()


def get_active_tickers():
    """Pull every distinct ticker currently on any user's watchlist."""
    try:
        result = sb.table("watchlist_items").select("ticker").execute()
        tickers = list(set(row["ticker"] for row in result.data if row.get("ticker")))
        return tickers
    except Exception as e:
        print(f"⚠️ failed to load active tickers: {e}")
        return []


def fetch_and_store():
    tickers = get_active_tickers()
    if not tickers:
        print("No tickers on any watchlist yet — nothing to ingest.")
        return

    print(f"Ingesting {len(tickers)} tickers: {tickers}")

    for t in tickers:
        try:
            data = yf.Ticker(t).history(period="5d", interval="15m")
            if data.empty:
                print(f"⚠️ no data for {t} — skipping")
                continue
            latest = data.iloc[-1]
            sb.table("price_snapshots").insert({
                "ticker": t,
                "price": float(latest["Close"]),
                "volume": int(latest["Volume"])
            }).execute()
        except Exception as e:
            print(f"⚠️ failed {t}: {e}")
        time.sleep(0.5)  # be gentle with yfinance across a growing ticker list


if __name__ == "__main__":
    fetch_and_store()

    from apscheduler.schedulers.blocking import BlockingScheduler
    scheduler = BlockingScheduler()
    scheduler.add_job(fetch_and_store, 'interval', minutes=15)
    print("Ingestion scheduler started — polling every 15 minutes.")
    scheduler.start()