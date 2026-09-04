# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import uuid
from diff_engine import get_baseline_stats, compute_zscore, classify_event, generate_reason
from ssl_setup import create_supabase_client
# add this import at the top, alongside your other imports

load_dotenv()
sb = create_supabase_client()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this later, fine for hackathon
    allow_methods=["*"],
    allow_headers=["*"],
)

# add this import at the top, alongside your other imports
import yfinance as yf

# add this new route anywhere among your existing routes
@app.get("/search")
def search_stocks(q: str):
    if not q or len(q.strip()) < 1:
        raise HTTPException(status_code=400, detail="Query parameter 'q' is required")

    try:
        results = yf.Search(q, max_results=8).quotes
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Search provider failed: {str(e)}")

    parsed = []
    for r in results:
        symbol = r.get("symbol")
        if not symbol:
            continue
        parsed.append({
            "ticker": symbol,
            "name": r.get("shortname") or r.get("longname") or symbol,
            "exchange": r.get("exchange", "NA"),
            "type": r.get("quoteType", "EQUITY")
        })

    return parsed
def validate_uuid(user_id: str):
    """user_id column is uuid type in Supabase — reject bad input early with a clean error."""
    try:
        uuid.UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"'{user_id}' is not a valid UUID. Generate one with: python3 -c \"import uuid; print(uuid.uuid4())\""
        )


@app.get("/watchlist/{user_id}")
def get_watchlist(user_id: str):
    validate_uuid(user_id)
    try:
        items = sb.table("watchlist_items").select("*").eq("user_id", user_id).execute().data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch watchlist: {str(e)}")

    enriched = []
    seen_tickers = set()

    for item in items:
        ticker = item["ticker"]
        if ticker in seen_tickers:
            continue
        seen_tickers.add(ticker)

        snap = (
            sb.table("price_snapshots")
            .select("*")
            .eq("ticker", ticker)
            .order("fetched_at", desc=True)
            .limit(1)
            .execute()
            .data
        )
        price = snap[0]["price"] if snap else 0
        enriched.append({
            **item,
            "price": price,
        })

    return enriched

@app.post("/watchlist/{user_id}")
def add_ticker(user_id: str, ticker: str):
    validate_uuid(user_id)
    try:
        existing = (
            sb.table("watchlist_items")
            .select("*")
            .eq("user_id", user_id)
            .eq("ticker", ticker)
            .execute()
            .data
        )
        if existing:
            return existing
        result = sb.table("watchlist_items").insert({"user_id": user_id, "ticker": ticker}).execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add ticker: {str(e)}")

@app.get("/digest/{user_id}")
def get_digest(user_id: str):
    validate_uuid(user_id)

    try:
        watchlist = sb.table("watchlist_items").select("ticker").eq("user_id", user_id).execute().data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch watchlist: {str(e)}")

    tickers = [w["ticker"] for w in watchlist]
    if not tickers:
        return []  # empty watchlist is a valid state, not an error

    events = []
    for ticker in tickers:
        try:
            # latest live snapshot
            snap = (
                sb.table("price_snapshots")
                .select("*")
                .eq("ticker", ticker)
                .order("fetched_at", desc=True)
                .limit(1)
                .execute()
                .data
            )
            if not snap:
                continue  # no live data yet for this ticker — skip, don't crash the whole digest

            current_price = snap[0]["price"]
            current_volume = snap[0]["volume"]

            baseline = get_baseline_stats(ticker)
            zscore = compute_zscore(current_price, baseline)
            severity, volume_ratio = classify_event(zscore, current_volume, baseline["avg_volume"])
            reason = generate_reason(ticker, zscore, volume_ratio)

            events.append({
                "ticker": ticker,
                "reason": reason,
                "severity": severity,
                "zscore": round(zscore, 2)
            })
        except Exception as e:
            # one bad ticker (e.g. yfinance hiccup) shouldn't take down the whole digest
            print(f"⚠️ skipping {ticker}: {e}")
            continue

    # sort by significance
    severity_rank = {"significant": 0, "notable": 1, "minor": 2}
    events.sort(key=lambda e: severity_rank[e["severity"]])
    return events
@app.post("/digest/{user_id}/mark-seen")
def mark_seen(user_id: str):
    validate_uuid(user_id)
    watchlist = sb.table("watchlist_items").select("ticker").eq("user_id", user_id).execute().data
    for w in watchlist:
        ticker = w["ticker"]
        latest_snap = sb.table("price_snapshots").select("id").eq("ticker", ticker).order("fetched_at", desc=True).limit(1).execute().data
        if latest_snap:
            sb.table("last_seen_snapshots").upsert({
                "user_id": user_id,
                "ticker": ticker,
                "snapshot_id": latest_snap[0]["id"]
            }).execute()
    return {"status": "marked seen"}