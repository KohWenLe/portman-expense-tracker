import { useState } from "react";
import { Expense, Project } from "@/lib/mock-data";
import { formatRM, formatDate } from "@/lib/format";
import { CategoryPill } from "./StatusBadge";
import { Pencil, Trash2, FileText, Hand, StickyNote } from "lucide-react";

interface Props {
  expenses: Expense[];
  projects: Project[];
  showProjectColumn?: boolean;
  selected: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onToggleClaim: (id: string) => void;
  onEdit: (e: Expense) => void;
  onDelete: (e: Expense) => void;
}

export function ExpenseTable({
  expenses, projects, showProjectColumn, selected,
  onToggleSelect, onToggleSelectAll, onToggleClaim, onEdit, onDelete,
}: Props) {
  const allSelected = expenses.length > 0 && expenses.every((e) => selected.includes(e.id));
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  const [hoverClaim, setHoverClaim] = useState<string | null>(null);

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="w-10 px-3 py-3">
              <input type="checkbox" checked={allSelected} onChange={onToggleSelectAll} className="h-4 w-4 rounded" />
            </th>
            <th className="px-3 py-3 text-left">Date</th>
            {showProjectColumn && <th className="px-3 py-3 text-left">Project</th>}
            <th className="px-3 py-3 text-left">Description</th>
            <th className="px-3 py-3 text-left">Category</th>
            <th className="px-3 py-3 text-right">Amount (RM)</th>
            <th className="px-3 py-3 text-left">Currency</th>
            <th className="px-3 py-3 text-left">Claimed</th>
            <th className="px-3 py-3 text-left">Source</th>
            <th className="px-3 py-3"></th>
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {expenses.map((e) => (
            <tr key={e.id} className="hover:bg-muted/30">
              <td className="px-3 py-3">
                <input type="checkbox" checked={selected.includes(e.id)} onChange={() => onToggleSelect(e.id)} className="h-4 w-4 rounded" />
              </td>
              <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatDate(e.date)}</td>
              {showProjectColumn && <td className="px-3 py-3 whitespace-nowrap">{projectName(e.projectId)}</td>}
              <td className="px-3 py-3 font-medium">{e.description}</td>
              <td className="px-3 py-3"><CategoryPill category={e.category} /></td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatRM(e.amountRM)}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {e.currency !== "MYR" ? (
                  <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-600/20 text-amber-800">
                    {e.currency} {e.amount.toFixed(2)}
                  </span>
                ) : (
                  "MYR"
                )}
              </td>
              <td className="px-3 py-3" onMouseEnter={() => setHoverClaim(e.id)} onMouseLeave={() => setHoverClaim(null)}>
                <button onClick={() => onToggleClaim(e.id)} className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${e.isClaimed ? "bg-emerald-500" : "bg-gray-300"}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${e.isClaimed ? "translate-x-4" : "translate-x-0.5"}`} />
                </button>
                {hoverClaim === e.id && e.isClaimed && e.claimedDate && (
                  <div className="absolute mt-1 rounded bg-foreground px-2 py-1 text-xs text-background">
                    Claimed {formatDate(e.claimedDate)}
                  </div>
                )}
              </td>
              <td className="px-3 py-3">
                {e.source === "PDF" ? (
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-700"><FileText className="h-3.5 w-3.5" /> PDF</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Hand className="h-3.5 w-3.5" /> Manual</span>
                )}
              </td>
              <td className="px-3 py-3">
                {e.notes && (
                  <span title={e.notes}><StickyNote className="h-4 w-4 text-amber-600" /></span>
                )}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(e)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(e)} className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
