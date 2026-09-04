import { Link } from "@tanstack/react-router";
import { Bookmark, Zap } from "lucide-react";
import { Sparkline } from "./Sparkline";
import type { Stock } from "@/lib/api/types";
import { cn } from "@/lib/utils";

interface StockRowProps {
  stock: Stock;
  onToggleWatch?: (ticker: string) => void;
}

export function StockRow({ stock, onToggleWatch }: StockRowProps) {
  const up = stock.dayChangePct >= 0;

  return (
    <div className="flex items-center gap-4 border-b border-border py-4">
      <Link
        to="/stock/$ticker"
        params={{ ticker: stock.ticker }}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-semibold tracking-tight">{stock.ticker}</span>
            {stock.unreadCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-[2px] text-[11px] font-semibold text-primary">
                <Zap className="h-3 w-3" />
                {stock.unreadCount}
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{stock.name}</p>
        </div>

        <Sparkline data={stock.sparklineData} up={up} />

        <div className="w-[104px] text-right">
          <div className="text-[17px] font-semibold tabular-nums tracking-tight">
            {stock.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div
            className={cn(
              "mt-0.5 text-[13px] font-medium tabular-nums",
              up ? "text-gain" : "text-loss",
            )}
          >
            {up ? "+" : ""}
            {stock.dayChangePct.toFixed(2)}%
          </div>
        </div>
      </Link>

      {onToggleWatch && (
        <button
          type="button"
          onClick={() => onToggleWatch(stock.ticker)}
          aria-label={stock.watched ? "Remove from watchlist" : "Add to watchlist"}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-secondary",
            stock.watched ? "text-primary" : "text-muted-foreground",
          )}
        >
          <Bookmark className="h-[18px] w-[18px]" fill={stock.watched ? "currentColor" : "none"} />
        </button>
      )}
    </div>
  );
}
