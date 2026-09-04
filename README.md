# Pulse Stock Watch

Build "Pulse" — a dark-themed stock watchlist app inspired by Groww's design language.

VISUAL STYLE

- Dark theme, near-black background (#0A0A0A)

- Accent blue #5076EE (primary actions, active tab, brand mark)

- Semantic green #63AD0E for gains, red #FF003C for losses — used ONLY for price direction, nowhere else

- Font: Inter, clean and numeric-forward

- Flat list rows with thin dividers, no heavy card borders — generous vertical spacing

- Bookmark ribbon icon (not heart/star) for watchlist add/remove

LAYOUT

Top bar: app logo + "Pulse" wordmark (left), search icon + avatar circle (right)

Tab row below top bar, underline-active style: "Watchlist" | "Digest" | "Explore"

SCREEN 1 — Watchlist (default tab)

List of stock rows: ticker + company name (left), current price in bold large type + day change % below it in green/red (right), tiny sparkline chart between them.

Each row has a small badge if it has unread changes, e.g. "⚡ 2" in a rounded pill, blue.

Empty state: centered icon + "Add stocks to build your Pulse" + button.

SCREEN 2 — Digest ("Since you checked")

Vertical timeline/feed layout, NOT a list. Each entry:

- Stock ticker + name

- One-line plain-English reason, e.g. "Moved 2.1σ above its usual range on 3x average volume"

- A small severity indicator (dot or bar) showing how significant vs other entries

- Timestamp of when this was detected

Sort by significance, most meaningful first. Include a subtle "Last checked: [date/time]" pill at top with a way to jump back to "now".

SCREEN 3 — Stock Detail

Price history line chart (7d/1m/3m toggle), followed by a chronological log of "detected events" for this stock (same reasoning-line format as the digest), so the detection logic is visible, not a black box.

DATA

Use placeholder/mock data for now with realistic structure:

{ ticker, name, price, dayChangePct, sparklineData: number[], events: [{ reason, severity, timestamp }] }

Build with React + TypeScript + Tailwind + shadcn/ui components. Structure it so a FastAPI backend can be wired in later via REST calls (use a clean api/ service layer, not inline fetches).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f56c2c8c-5f2f-4f88-9673-0c60f03ad537).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
