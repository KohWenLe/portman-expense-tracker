import { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string;
  icon?: LucideIcon;
  tone?: "default" | "positive" | "negative" | "muted";
  hint?: string;
}

export function StatCard({ label, value, icon: Icon, tone = "default", hint }: Props) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-destructive"
        : tone === "muted"
          ? "text-muted-foreground"
          : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-foreground">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <p className={`mt-2 text-2xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
