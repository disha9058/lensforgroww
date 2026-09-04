import type { Stock } from "./types";

const now = Date.now();
const ago = (mins: number) => new Date(now - mins * 60_000).toISOString();

function series(start: number, n: number, drift: number, seed: number): number[] {
  const out: number[] = [];
  let v = start;
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = (s * 9301 + 49297) % 233280;
    const r = s / 233280 - 0.5;
    v = v * (1 + drift / n + r * 0.018);
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

export const MOCK_STOCKS: Stock[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    price: 184.32,
    dayChangePct: 4.18,
    sparklineData: series(170, 40, 0.09, 11),
    watched: true,
    unreadCount: 2,
    events: [
      {
        id: "nvda-1",
        reason: "Moved 2.1σ above its usual range on 3x average volume",
        severity: 3,
        timestamp: ago(42),
      },
      {
        id: "nvda-2",
        reason: "Broke above its 30-day high for the first time since April",
        severity: 2,
        timestamp: ago(310),
      },
      {
        id: "nvda-3",
        reason: "Options activity clustered near the 190 strike, unusual for a Tuesday",
        severity: 1,
        timestamp: ago(1520),
      },
    ],
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    price: 241.07,
    dayChangePct: -2.94,
    sparklineData: series(258, 40, -0.07, 27),
    watched: true,
    unreadCount: 1,
    events: [
      {
        id: "tsla-1",
        reason: "Fell 1.8σ below its 20-day mean with volume 2.4x the norm",
        severity: 3,
        timestamp: ago(96),
      },
      {
        id: "tsla-2",
        reason: "Third consecutive down day — longest streak in 6 weeks",
        severity: 2,
        timestamp: ago(1180),
      },
    ],
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    price: 229.84,
    dayChangePct: 0.62,
    sparklineData: series(226, 40, 0.02, 5),
    watched: true,
    unreadCount: 0,
    events: [
      {
        id: "aapl-1",
        reason: "Volatility compressed to a 90-day low — range is unusually tight",
        severity: 1,
        timestamp: ago(520),
      },
    ],
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    price: 162.45,
    dayChangePct: 3.07,
    sparklineData: series(155, 40, 0.05, 71),
    watched: true,
    unreadCount: 1,
    events: [
      {
        id: "amd-1",
        reason: "Tracked NVDA's move but with 1.6x the relative strength",
        severity: 2,
        timestamp: ago(58),
      },
      {
        id: "amd-2",
        reason: "Gap-up open held through the first hour, no fade",
        severity: 1,
        timestamp: ago(400),
      },
    ],
  },
  {
    ticker: "HDFCBANK",
    name: "HDFC Bank Ltd.",
    price: 1678.9,
    dayChangePct: -0.41,
    sparklineData: series(1690, 40, -0.01, 133),
    watched: true,
    unreadCount: 0,
    events: [
      {
        id: "hdfc-1",
        reason: "Flat against a sector that moved 1.2% — quiet divergence",
        severity: 1,
        timestamp: ago(700),
      },
    ],
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    price: 431.16,
    dayChangePct: 1.24,
    sparklineData: series(424, 40, 0.03, 88),
    watched: false,
    unreadCount: 0,
    events: [],
  },
  {
    ticker: "RELIANCE",
    name: "Reliance Industries",
    price: 2938.5,
    dayChangePct: 0.18,
    sparklineData: series(2920, 40, 0.01, 42),
    watched: false,
    unreadCount: 0,
    events: [],
  },
  {
    ticker: "COIN",
    name: "Coinbase Global",
    price: 268.72,
    dayChangePct: -5.31,
    sparklineData: series(292, 40, -0.09, 200),
    watched: false,
    unreadCount: 0,
    events: [
      {
        id: "coin-1",
        reason: "Down 5%+ on the day, 2.9σ move against a flat market",
        severity: 3,
        timestamp: ago(120),
      },
    ],
  },
];

export const LAST_CHECKED = new Date(now - 6 * 60 * 60_000).toISOString();
