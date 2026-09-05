import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { searchStocks, type SearchHit } from "@/lib/api/stocks";
import { TickerLogo } from "./TickerLogo";

type Status = "idle" | "loading" | "done" | "error";

export function SearchOverlay({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setStatus("idle");
      setResults([]);
      return;
    }
    let cancelled = false;
    setStatus("loading");
    const timer = setTimeout(() => {
      searchStocks(q)
        .then((hits) => {
          if (cancelled) return;
          setResults(hits);
          setStatus("done");
        })
        .catch(() => {
          if (cancelled) return;
          setResults([]);
          setStatus("error");
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function openTicker(ticker: string) {
    onClose();
    void navigate({ to: "/stock/$ticker", params: { ticker } });
  }

  return (
    <div className="fixed inset-0 z-50 bg-background">
      <div className="mx-auto max-w-3xl px-5">
        <div className="flex h-14 items-center gap-3 border-b border-border">
          <Search className="h-[18px] w-[18px] shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a stock or company"
            className="h-9 flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-3.5rem)] overflow-y-auto pb-10">
          {status === "idle" && (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              Search for a stock or company
            </p>
          )}

          {status === "loading" &&
            [0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-4 border-b border-border py-4">
                <div className="h-10 w-10 animate-pulse rounded-xl bg-secondary" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-20 animate-pulse rounded bg-secondary" />
                  <div className="h-3 w-40 animate-pulse rounded bg-secondary" />
                </div>
              </div>
            ))}

          {status === "error" && (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              Search unavailable, try again
            </p>
          )}

          {status === "done" && results.length === 0 && (
            <p className="py-10 text-center text-[13px] text-muted-foreground">
              No results found for “{query.trim()}”
            </p>
          )}

          {status === "done" &&
            results.map((hit) => (
              <button
                key={`${hit.ticker}-${hit.exchange}`}
                type="button"
                onClick={() => openTicker(hit.ticker)}
                className="flex w-full items-center gap-4 border-b border-border py-4 text-left transition-colors hover:bg-secondary/40"
              >
                <TickerLogo ticker={hit.ticker} />
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold tracking-tight">{hit.ticker}</div>
                  <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{hit.name}</p>
                </div>
                <span className="text-[11px] font-medium uppercase text-muted-foreground">
                  {hit.exchange}
                </span>
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
