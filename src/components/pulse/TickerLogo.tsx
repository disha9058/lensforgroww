import { cn } from "@/lib/utils";

const PALETTE = [
  "var(--logo-1)",
  "var(--logo-2)",
  "var(--logo-3)",
  "var(--logo-4)",
  "var(--logo-5)",
  "var(--logo-6)",
];

function hash(str: string) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

interface TickerLogoProps {
  ticker: string;
  size?: number;
  className?: string;
}

export function TickerLogo({ ticker, size = 40, className }: TickerLogoProps) {
  const color = PALETTE[hash(ticker) % PALETTE.length];
  const monogram = ticker.slice(0, 2).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[10px] font-bold text-logo-foreground",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: Math.round(size * 0.36),
        letterSpacing: "-0.02em",
      }}
    >
      {monogram}
    </span>
  );
}
