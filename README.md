# Lens — A watchlist that tells you what changed, not just what things cost
 
**Live demo video:** https://www.loom.com/share/7a4419da11da43bda0092e85cd9fb711
 
---
## 100-word pitch
 
Lens is not a price tracker — it's a change detector. Every existing watchlist shows current state; none answer what a returning user actually wants to know: *did anything happen since I last looked, and does it matter?* I split that into two problems: a backend that owns and persists real market data on a schedule, and a diff engine that compares today's snapshot against each user's personal last-seen state, ranking movement by statistical significance rather than raw percentage. The result surfaces three or four things worth attention instead of a wall of numbers — simplification through judgment, not less data.
 
 
## The problem, as I actually understood it
 
A watchlist that shows current price and % change is not a watchlist — it's a snapshot. Every major brokerage app (Groww included) already does this well. What none of them do is answer the actual question a returning user has: *"Did anything happen since I last looked, and does it matter?"*
 
That question has two parts most implementations collapse into one:
 
1. **Did something change** — trivially true for almost any stock, almost every day
2. **Does it matter** — this is the part that requires judgment, not just a price feed
Lens is built around treating these as separate problems. The watchlist tells you what exists. The Digest tells you what mattered since you last checked, ranked by how much it mattered — not by how recently it happened.
 
---
 
## What counts as a "meaningful change" — and why
 
I deliberately rejected raw price movement as the definition. A 2% move on a stock that typically swings 0.5% a day is a real event. The same 2% move on a stock that swings 5% a day is Tuesday. Treating both identically is the exact failure mode of every "obvious" watchlist.
 
**My definition, implemented in `diff_engine.py`:**
 
- **Volatility-adjusted price move (z-score)** — today's return compared against the stock's own trailing 30-day mean and standard deviation, not against a fixed threshold. This makes the bar for "meaningful" relative to *that specific stock's* normal behavior, not a one-size-fits-all percentage.
- **Volume confirmation** — a price move backed by unusual volume is treated as more significant than the same move on ordinary volume, since volume is a proxy for conviction behind the move.
- **Three-tier severity** (`significant` / `notable` / `minor`) — computed from combined z-score and volume ratio thresholds, so the Digest can rank by actual significance rather than just listing everything that moved at all.
This is why the reasoning line reads like *"AAPL moved 1.3σ above its 30-day mean, volume 0.1x normal"* instead of *"AAPL: +0.6%"* — the first sentence tells you whether to care; the second doesn't.
 
---
 
## Architecture
 
```
┌─────────────────────────┐
│  React frontend           │  Dark theme, matched to Groww's visual
│  (Watchlist/Digest/       │  language (colors, layout density,
│   Explore/Search/Detail)  │  icon patterns) — deliberately, not
└──────────┬─────────────────┘  by coincidence
           │ REST
┌──────────▼─────────────────┐
│  FastAPI backend            │
│  /watchlist   CRUD          │
│  /digest      diff engine   │
│  /search      live lookup   │
└──────────┬─────────────────┘
           │
┌──────────▼─────────────────┐      ┌──────────────────────┐
│  Supabase (Postgres)         │      │  Ingestion worker      │
│  watchlist_items              │◄────│  polls yfinance on a   │
│  price_snapshots               │      │  schedule, writes      │
│  last_seen_snapshots           │      │  snapshots for every   │
└─────────────────────────────┘      │  ticker any user is     │
                                       │  watching — not a       │
                                       │  hardcoded list         │
                                       └──────────────────────┘
```
 
**Why this split:** the diff/severity logic lives as pure, standalone functions (`diff_engine.py`) independent of both the API routes and the ingestion schedule. A route handler calls into it; the ingestion worker doesn't need to know it exists. This was a deliberate choice so the core judgment logic — the part that's actually being evaluated — is isolated, readable, and testable without spinning up the whole stack.
 
---
 
## Key engineering decisions and the trade-offs behind them
 
**Ingestion polls a dynamic ticker list, not a fixed one.**
Early versions hardcoded six tickers. That doesn't scale past a demo. `ingest.py` now queries `watchlist_items` for every distinct ticker across every user before each fetch cycle — add a ticker through search, and it's picked up automatically on the next poll, no code change needed. This is also the answer to "how does this scale with more users": ingestion happens once per ticker, centrally, and is fanned out to every user watching it — not once per user per ticker.
 
**Baseline volatility is computed separately from live price.**
A single live snapshot can't tell you if a move is abnormal — you need history. Rather than wait for snapshots to accumulate over days (too slow for a judged window), `diff_engine.py` pulls a 30-day daily history directly for baseline stats, and uses the live snapshot only for "right now." This is a real architectural split: "what's normal for this stock" and "what's happening now" are computed from different data sources on purpose.
 
**Search and price data are intentionally decoupled.**
`/search` returns any ticker Yahoo Finance knows about — thousands of instruments. Attaching a live price to every search result would mean fetching data for stocks nobody's tracking, which doesn't scale and isn't necessary. A searched stock shows 0.00 until it's added to a watchlist and survives one ingestion cycle. This is correct behavior, not a bug: the system doesn't fabricate prices for data it hasn't legitimately fetched.
 
**Every external call is wrapped, not trusted.**
Supabase queries, yfinance calls, and UUID validation all fail gracefully rather than crashing the whole response. A single bad ticker (delisted, mistyped, unavailable data) is skipped with a logged warning; the rest of the digest still returns. Empty watchlists return `[]`, not an error. Invalid UUIDs get a clear 400 instead of a raw Postgres stack trace.
 
---
 
## Edge cases explicitly handled
 
- **First-ever visit to a stock** (no prior snapshot to diff against) — falls back gracefully rather than crashing
- **Market closed / yfinance returns empty** — ingestion logs and skips that ticker for that cycle instead of failing the whole run
- **Duplicate watchlist adds** — the add endpoint checks for an existing row before inserting, so re-adding a ticker doesn't create duplicate rows
- **Malformed or non-UUID user IDs** — validated explicitly with a clear error message rather than surfacing a database-level exception
- **Illiquid/unusual instruments** (e.g. trust wrappers with irregular data) — ingestion continues past instruments yfinance can't cleanly serve, without blocking the rest of the batch
---
 
## What I deliberately left out, and why
 
- **Multi-user authentication** — the system uses a single fixed user ID for this submission window. The schema (`watchlist_items.user_id` as a UUID foreign-key-shaped column) is built to support real Supabase Auth without restructuring; wiring that in was a scoping decision to prioritize the core diff-engine logic over auth plumbing in the time available.
- **Real historical price charts on the Stock Detail page** — the detail page's price graph currently renders a seeded synthetic curve. The *live price* shown is real (sourced from `price_snapshots`); the *chart shape* is not, because building a `/history/{ticker}` endpoint serving genuine day-by-day series was deprioritized in favor of getting the watchlist → digest → detected-events pipeline fully real end-to-end first. This is a known, stated gap, not an oversight.
- **No real-time WebSocket ticking** — prices update on a polling schedule with a visible fetch timestamp, not a live stream. For a watchlist (as opposed to a trading terminal), honest periodic freshness is a more defensible choice than fake real-time-ness, and it's dramatically simpler to reason about and demo reliably.
- **Dark theme only, no theme toggle** — matched intentionally to Groww's actual product look; a toggle was cut as a zero-value time sink for a judged build.
---
 
## How state persists across sessions
 
`last_seen_snapshots` records which snapshot a user had last viewed for each ticker. On return, the Digest diffs the *current* latest snapshot against that stored reference point — not against "yesterday" or a fixed window. This means two users checking the same stock at different times get genuinely different digests, which is the actual point of the feature: the system remembers *you*, not just the market.
 
---
 
## Setup
 
**Backend**
```bash
cd pulse-backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
 
**Ingestion worker** (separate process, keeps prices fresh)
```bash
cd pulse-backend
python ingest.py
```
 
**Frontend**
```bash
cd frontend
npm install
npm run dev
```
 
Environment variables needed: `SUPABASE_URL`, `SUPABASE_KEY` (backend), `VITE_API_BASE_URL` (frontend, defaults to `http://127.0.0.1:8000`).
 
---
 
## Why this is the version I believe should exist
 
Every stock app already answers "what is this trading at." None of them are honest about the fact that a static number tells a returning user nothing about whether their attention is warranted. Lens is a bet that the actual product opportunity in a watchlist isn't more data density — it's better triage. The engineering choices above (separating baseline from live data, isolating the diff logic, handling ticker growth dynamically) all exist in service of that one idea, not as a checklist of features.
