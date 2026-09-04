import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { to: "/", label: "Watchlist" },
  { to: "/digest", label: "Digest" },
  { to: "/explore", label: "Explore" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-5">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
                <polyline
                  points="2,13 7,13 10,6 14,19 17,13 22,13"
                  fill="none"
                  stroke="var(--primary-foreground)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="text-[17px] font-semibold tracking-tight">Pulse</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Search"
              className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-foreground">
              AR
            </span>
          </div>
        </div>

        <nav className="mx-auto flex max-w-3xl gap-6 px-5">
          {TABS.map((t) => (
            <Link
              key={t.to}
              to={t.to}
              activeOptions={{ exact: t.to === "/" }}
              className="relative -mb-px border-b-2 border-transparent py-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{ className: "!border-primary !text-foreground" }}

            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-20">{children}</main>
    </div>
  );
}
