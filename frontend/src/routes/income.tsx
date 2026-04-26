import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Modal, ConfirmDialog } from "@/components/Modal";
import { IncomeForm } from "@/components/forms/IncomeForm";
import { IncomeTable } from "@/components/IncomeTable";
import { EmptyState } from "@/components/EmptyState";
import { Income } from "@/lib/mock-data";
import { Plus, Wallet } from "lucide-react";

export const Route = createFileRoute("/income")({
  head: () => ({ meta: [{ title: "Income — ExpenseTrack" }] }),
  component: IncomePage,
});

function IncomePage() {
  const { projects, income, addIncome, updateIncome, deleteIncome } = useStore();
  const toast = useToast();
  const [form, setForm] = useState<{ open: boolean; initial?: Income }>({ open: false });
  const [del, setDel] = useState<Income | null>(null);

  const [projectFilter, setProjectFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => income.filter((i) => {
    if (projectFilter !== "all" && i.projectId !== projectFilter) return false;
    if (from && i.date < from) return false;
    if (to && i.date > to) return false;
    if (search && !`${i.source} ${i.description}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [income, projectFilter, from, to, search]);

  return (
    <div className="px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Income</h1>
          <p className="text-sm text-muted-foreground">All income across every project.</p>
        </div>
        <button onClick={() => setForm({ open: true })} className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add Income
        </button>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All projects</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-md border border-input bg-background px-3 py-2 text-sm" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="rounded-md border border-input bg-background px-3 py-2 text-sm w-64" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState icon={Wallet} title="No income recorded" message="Record an invoice, sponsorship, or refund to get started." />
        </div>
      ) : (
        <IncomeTable
          income={filtered}
          projects={projects}
          showProjectColumn
          onEdit={(i) => setForm({ open: true, initial: i })}
          onDelete={(i) => setDel(i)}
        />
      )}

      <Modal open={form.open} onClose={() => setForm({ open: false })} title={form.initial ? "Edit Income" : "Add Income"}>
        <IncomeForm
          initial={form.initial}
          projects={projects}
          onCancel={() => setForm({ open: false })}
          onSave={(i) => {
            if (form.initial) { updateIncome(form.initial.id, i.projectId, i); toast("success", "Income updated"); }
            else { addIncome(i.projectId, i); toast("success", "Income added"); }
            setForm({ open: false });
          }}
        />
      </Modal>

      <ConfirmDialog
        open={!!del}
        title="Delete income?"
        message={del ? `Delete "${del.source}"? This cannot be undone.` : ""}
        onCancel={() => setDel(null)}
        onConfirm={() => { if (del) { deleteIncome(del.id); toast("success", "Income deleted"); setDel(null); } }}
      />
    </div>
  );
}
