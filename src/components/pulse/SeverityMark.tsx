import type { Severity } from "@/lib/api/types";

const LABEL: Record<Severity, string> = { 1: "Minor", 2: "Notable", 3: "Significant" };

export function SeverityMark({ severity }: { severity: Severity }) {
  return (
    <span className="flex items-center gap-1.5" title={LABEL[severity]}>
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={
              n <= severity
                ? "w-[3px] rounded-full bg-primary"
                : "w-[3px] rounded-full bg-border"
            }
            style={{ height: 4 + n * 3 }}
          />
        ))}
      </span>
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {LABEL[severity]}
      </span>
    </span>
  );
}
