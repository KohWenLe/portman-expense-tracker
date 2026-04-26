import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { ExpenseTable } from "@/components/ExpenseTable";
import { EmptyState } from "@/components/EmptyState";
import { CATEGORIES, Expense } from "@/lib/mock-data";
import { Plus, Receipt } from "lucide-react";

export const Route = createFileRoute("/expenses")({
  head: () => ({ meta: [{ title: "Expenses — ExpenseTrack" }] }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { projects, expenses, addExpense, updateExpense, deleteExpense, toggleClaim, bulkClaim } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; initial?: Expense }>({ open: false });
  const [del, setDel] = useState<Expense | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const [projectFilter, setProjectFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [claimFilter, setClaimFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => expenses.filter((e) => {
    if (projectFilter !== "all" && e.projectId !== projectFilter) return false;
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (claimFilter === "claimed" && !e.isClaimed) return false;
    if (claimFilter === "unclaimed" && e.isClaimed) return false;
    if (from && e.date < from) return false;
    if (to && e.date > to) return false;
    if (search && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [expenses, projectFilter, catFilter, claimFilter, from, to, search]);

  return (
    <div className="px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expenses</h1>
          <p className="text-sm text-muted-foreground">All expenses across every project.</p>
        </div>
        <div className="flex gap-2">
          {selected.length > 0 && (
            <button onClick={() => { bulkClaim(selected); setSelected([]); toast("success", `${selected.length} marked as claimed`); }} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:opacity-90">
              Mark as Claimed ({selected.length})
            </button>
          )}
          <button onClick={() => setForm({ open: true })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
            <Plus className="h-4 w-4" /> Add Expense
          </button>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={claimFilter} onChange={(e) => setClaimFilter(e.target.value as "all" | "claimed" | "unclaimed")} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All</option>
          <option value="claimed">Claimed</option>
          <option value="unclaimed">Unclaimed</option>
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={Receipt} title="No expenses match your filters" message="Try clearing some filters or add a new expense." />
        </div>
      ) : (
        <ExpenseTable
          expenses={filtered}
          projects={projects}
          showProjectColumn
          selected={selected}
          onToggleSelect={(id) => setSelected((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id])}
          onToggleSelectAll={() => setSelected(selected.length === filtered.length ? [] : filtered.map((e) => e.id))}
          onToggleClaim={(id) => {
            const expense = expenses.find((e) => e.id === id);
            if (!expense) return;
            toggleClaim(id, expense.isClaimed);
          }}
          onEdit={(e) => setForm({ open: true, initial: e })}
          onDelete={(e) => setDel(e)}
        />
      )}

      <Modal open={form.open} onClose={() => setForm({ open: false })} title={form.initial ? "Edit Expense" : "Add Expense"}>
        <ExpenseForm
          initial={form.initial}
          projects={projects}
          onCancel={() => setForm({ open: false })}
          onSave={(e) => {
            if (form.initial) { updateExpense(form.initial.id, e.projectId, e); toast("success", "Expense updated"); }
            else { addExpense(e.projectId, e); toast("success", "Expense added"); }
            setForm({ open: false });
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="Delete expense?"
        message={del ? `Delete "${del.description}"? This cannot be undone.` : ""}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteExpense(del.id); toast("success", "Expense deleted"); setDel(null); } }}
      />
    </div>
  );
}
