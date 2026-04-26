import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import { IncomeTable } from "@/components/IncomeTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { formatRM } from "@/lib/format";
import { CATEGORIES, Expense, Income } from "@/lib/mock-data";
import { Pencil, Trash2, Plus, Receipt, Wallet } from "lucide-react";

export const Route = createFileRoute("/projects_/$id")({
  component: ProjectDetail,
});

function ProjectDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const {
    projects, expenses, income, updateProject, deleteProject,
    addExpense, updateExpense, deleteExpense, toggleClaim, bulkClaim,
    addIncome, updateIncome, deleteIncome, getProjectBreakdown,
  } = useStore();

  const project = projects.find((p) => p.id === id);
  const [tab, setTab] = useState<"expenses" | "income">("expenses");
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [expenseForm, setExpenseForm] = useState<{ open: boolean; initial?: Expense }>({ open: false });
  const [incomeForm, setIncomeForm] = useState<{ open: boolean; initial?: Income }>({ open: false });
  const [delExpense, setDelExpense] = useState<Expense | null>(null);
  const [delIncome, setDelIncome] = useState<Income | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [claimFilter, setClaimFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [search, setSearch] = useState("");
  const [breakdown, setBreakdown] = useState<Array<{ category: string; claimed: number; unclaimed: number }>>([]);

  const projectExpenses = useMemo(
    () => expenses.filter((e) => e.projectId === id),
    [expenses, id],
  );
  const projectIncome = useMemo(
    () => income.filter((i) => i.projectId === id),
    [income, id],
  );

  useEffect(() => {
    let cancelled = false;
    getProjectBreakdown(id)
      .then((rows) => {
        if (!cancelled) setBreakdown(rows);
      })
      .catch(() => {
        if (!cancelled) setBreakdown([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id, expenses, getProjectBreakdown]);

  if (!project) {
    return (
      <div className="px-8 py-12">
        <p className="text-muted-foreground">Project not found.</p>
        <Link to="/projects" className="text-primary hover:underline">Back to projects</Link>
      </div>
    );
  }

  const totalExp = projectExpenses.reduce((s, e) => s + e.amountRM, 0);
  const totalInc = projectIncome.reduce((s, i) => s + i.amountRM, 0);
  const claimed = projectExpenses.filter((e) => e.isClaimed).reduce((s, e) => s + e.amountRM, 0);
  const outstanding = totalExp - claimed;
  const net = totalInc - totalExp;
  const remaining = project.totalBudget != null ? project.totalBudget - totalExp : null;

  const filteredExpenses = projectExpenses.filter((e) => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (claimFilter === "claimed" && !e.isClaimed) return false;
    if (claimFilter === "unclaimed" && e.isClaimed) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="px-8 py-8">
      <div className="mb-2">
        <Link to="/projects" className="text-sm text-muted-foreground hover:text-foreground">← Projects</Link>
      </div>
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <StatusBadge status={project.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{project.description}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
            <Pencil className="h-4 w-4" /> Edit
          </button>
          <button onClick={() => setConfirmDel(true)} className="inline-flex items-center gap-1.5 rounded-md border border-destructive/30 bg-background px-3 py-2 text-sm font-medium text-destructive hover:bg-red-50">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <StatCard label="Total Income" value={formatRM(totalInc)} tone="positive" />
        <StatCard label="Total Expenses" value={formatRM(totalExp)} />
        <StatCard label="Net Position" value={formatRM(net)} tone={net >= 0 ? "positive" : "negative"} />
        <StatCard label="Total Claimed" value={formatRM(claimed)} />
        <StatCard label="Outstanding" value={formatRM(outstanding)} tone={outstanding > 0 ? "negative" : "muted"} />
        <StatCard label="Budget Remaining" value={remaining != null ? formatRM(remaining) : "No budget set"} tone={remaining != null && remaining < 0 ? "negative" : "muted"} />
      </div>

      <div className="mb-8 rounded-xl border border-border bg-card">
        <div className="border-b border-border px-4 py-3">
          <h3 className="font-semibold">Expense Breakdown by Category</h3>
          <p className="text-xs text-muted-foreground">Claimed vs unclaimed totals in RM</p>
        </div>
        {breakdown.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted-foreground">No categorized expenses yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-right">Claimed</th>
                  <th className="px-4 py-3 text-right">Unclaimed</th>
                  <th className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {breakdown.map((row) => (
                  <tr key={row.category}>
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRM(row.claimed)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatRM(row.unclaimed)}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatRM(row.claimed + row.unclaimed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-b border-border mb-4 flex gap-1">
        {(["expenses", "income"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "expenses" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={claimFilter} onChange={(e) => setClaimFilter(e.target.value as "all" | "claimed" | "unclaimed")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="all">All</option>
                <option value="claimed">Claimed</option>
                <option value="unclaimed">Unclaimed</option>
              </select>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search description..." className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64" />
            </div>
            <div className="flex gap-2">
              {selected.length > 0 && (
                <button onClick={() => { bulkClaim(selected); setSelected([]); toast("success", `${selected.length} marked as claimed`); }} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
                  Mark Selected as Claimed ({selected.length})
                </button>
              )}
              <button onClick={() => setExpenseForm({ open: true })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                <Plus className="h-4 w-4" /> Add Expense
              </button>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState icon={Receipt} title="No expenses yet" message="Add one manually or import from a PDF statement." />
            </div>
          ) : (
            <ExpenseTable
              expenses={filteredExpenses}
              projects={projects}
              selected={selected}
              onToggleSelect={(eid) => setSelected((s) => s.includes(eid) ? s.filter((x) => x !== eid) : [...s, eid])}
              onToggleSelectAll={() => setSelected(selected.length === filteredExpenses.length ? [] : filteredExpenses.map((e) => e.id))}
              onToggleClaim={(eid) => {
                const expense = projectExpenses.find((e) => e.id === eid);
                if (!expense) return;
                toggleClaim(eid, expense.isClaimed);
              }}
              onEdit={(e) => setExpenseForm({ open: true, initial: e })}
              onDelete={(e) => setDelExpense(e)}
            />
          )}
        </>
      )}

      {tab === "income" && (
        <>
          <div className="mb-4 flex justify-end">
            <button onClick={() => setIncomeForm({ open: true })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
              <Plus className="h-4 w-4" /> Add Income
            </button>
          </div>
          {projectIncome.length === 0 ? (
            <div className="rounded-xl border border-border bg-card">
              <EmptyState icon={Wallet} title="No income yet" message="Record an invoice payment, sponsorship, or other income." />
            </div>
          ) : (
            <IncomeTable
              income={projectIncome}
              projects={projects}
              onEdit={(i) => setIncomeForm({ open: true, initial: i })}
              onDelete={(i) => setDelIncome(i)}
            />
          )}
        </>
      )}

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Project">
        <ProjectForm
          initial={project}
          onCancel={() => setEditOpen(false)}
          onSave={(p) => { updateProject(project.id, p); setEditOpen(false); toast("success", "Project updated"); }}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDel}
        title="Delete project?"
        message={`This will permanently delete "${project.name}" along with its expenses and income. This action cannot be undone.`}
        onCancel={() => setConfirmDel(false)}
        onConfirm={() => { deleteProject(project.id); toast("success", "Project deleted"); navigate({ to: "/projects" }); }}
      />

      <Modal open={expenseForm.open} onClose={() => setExpenseForm({ open: false })} title={expenseForm.initial ? "Edit Expense" : "Add Expense"}>
        <ExpenseForm
          initial={expenseForm.initial}
          projectId={project.id}
          projects={projects}
          onCancel={() => setExpenseForm({ open: false })}
          onSave={(e) => {
            if (expenseForm.initial) {
              updateExpense(expenseForm.initial.id, project.id, e);
              toast("success", "Expense updated");
            } else {
              addExpense(project.id, e);
              toast("success", "Expense added");
            }
            setExpenseForm({ open: false });
          }}
        />
      </Modal>

      <Modal open={incomeForm.open} onClose={() => setIncomeForm({ open: false })} title={incomeForm.initial ? "Edit Income" : "Add Income"}>
        <IncomeForm
          initial={incomeForm.initial}
          projectId={project.id}
          projects={projects}
          onCancel={() => setIncomeForm({ open: false })}
          onSave={(i) => {
            if (incomeForm.initial) {
              updateIncome(incomeForm.initial.id, project.id, i);
              toast("success", "Income updated");
            } else {
              addIncome(project.id, i);
              toast("success", "Income added");
            }
            setIncomeForm({ open: false });
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!delExpense}
        title="Delete expense?"
        message={delExpense ? `Delete "${delExpense.description}"? This cannot be undone.` : ""}
        onCancel={() => setDelExpense(null)}
        onConfirm={() => { if (delExpense) { deleteExpense(delExpense.id); toast("success", "Expense deleted"); setDelExpense(null); } }}
      />

      <ConfirmDialog
        open={!!delIncome}
        title="Delete income?"
        message={delIncome ? `Delete "${delIncome.source}"? This cannot be undone.` : ""}
        onCancel={() => setDelIncome(null)}
        onConfirm={() => { if (delIncome) { deleteIncome(delIncome.id); toast("success", "Income deleted"); setDelIncome(null); } }}
      />
    </div>
  );
}
