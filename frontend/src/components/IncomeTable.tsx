import { Income, Project } from "@/lib/mock-data";
import { formatRM, formatDate } from "@/lib/format";
import { Pencil, Trash2 } from "lucide-react";

interface Props {
  income: Income[];
  projects: Project[];
  showProjectColumn?: boolean;
  onEdit: (i: Income) => void;
  onDelete: (i: Income) => void;
}

export function IncomeTable({ income, projects, showProjectColumn, onEdit, onDelete }: Props) {
  const projectName = (id: string) => projects.find((p) => p.id === id)?.name ?? "—";
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-3 text-left">Date</th>
            {showProjectColumn && <th className="px-3 py-3 text-left">Project</th>}
            <th className="px-3 py-3 text-left">Source</th>
            <th className="px-3 py-3 text-left">Description</th>
            <th className="px-3 py-3 text-right">Amount (RM)</th>
            <th className="px-3 py-3 text-left">Currency</th>
            <th className="px-3 py-3 text-left">Notes</th>
            <th className="px-3 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {income.map((i) => (
            <tr key={i.id} className="hover:bg-muted/30">
              <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{formatDate(i.date)}</td>
              {showProjectColumn && <td className="px-3 py-3 whitespace-nowrap">{projectName(i.projectId)}</td>}
              <td className="px-3 py-3 font-medium">{i.source}</td>
              <td className="px-3 py-3 text-muted-foreground">{i.description}</td>
              <td className="px-3 py-3 text-right font-semibold tabular-nums">{formatRM(i.amountRM)}</td>
              <td className="px-3 py-3 text-xs text-muted-foreground">
                {i.currency !== "MYR" ? (
                  <span className="inline-flex items-center rounded bg-amber-50 px-1.5 py-0.5 ring-1 ring-amber-600/20 text-amber-800">
                    {i.currency} {i.amount.toFixed(2)}
                  </span>
                ) : (
                  "MYR"
                )}
              </td>
              <td className="px-3 py-3 max-w-xs truncate text-muted-foreground" title={i.notes}>{i.notes}</td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-1">
                  <button onClick={() => onEdit(i)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => onDelete(i)} className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
