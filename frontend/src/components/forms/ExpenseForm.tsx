import { useState, useEffect } from "react";
import {
  CATEGORIES,
  CURRENCIES,
  Currency,
  Expense,
  ExpenseCategory,
  Project,
} from "@/lib/mock-data";

interface Props {
  initial?: Expense;
  projectId?: string;
  projects: Project[];
  onCancel: () => void;
  onSave: (e: Omit<Expense, "id">) => void;
}

export function ExpenseForm({ initial, projectId, projects, onCancel, onSave }: Props) {
  const [pid, setPid] = useState(initial?.projectId ?? projectId ?? projects[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "MYR");
  const [amountRM, setAmountRM] = useState<string>(initial?.amountRM.toString() ?? "");
  const [category, setCategory] = useState<ExpenseCategory>(initial?.category ?? "Others");
  const [isClaimed, setIsClaimed] = useState(initial?.isClaimed ?? false);
  const [claimedDate, setClaimedDate] = useState(initial?.claimedDate ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [sourceRef, setSourceRef] = useState(initial?.sourceReference ?? "");

  useEffect(() => {
    if (currency === "MYR") setAmountRM(amount);
  }, [currency, amount]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || !description || !amount) return;
    onSave({
      projectId: pid,
      date,
      description,
      amount: Number(amount),
      currency,
      amountRM: Number(amountRM),
      category,
      isClaimed,
      claimedDate: isClaimed ? claimedDate || new Date().toISOString().slice(0, 10) : undefined,
      notes: notes || undefined,
      source: initial?.source ?? "Manual",
      sourceReference: sourceRef || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!projectId && (
        <Field label="Project" required>
          <select value={pid} onChange={(e) => setPid(e.target.value)} className={inputCls}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputCls} />
        </Field>
        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)} className={inputCls}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <Field label="Description / Vendor" required>
        <input required value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
      </Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Amount" required>
          <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value as Currency)} className={inputCls}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Amount in RM" required>
          <input type="number" step="0.01" required value={amountRM} onChange={(e) => setAmountRM(e.target.value)} disabled={currency === "MYR"} className={inputCls} />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isClaimed} onChange={(e) => setIsClaimed(e.target.checked)} className="h-4 w-4 rounded border-input" />
        Already claimed
      </label>
      {isClaimed && (
        <Field label="Claimed Date">
          <input type="date" value={claimedDate} onChange={(e) => setClaimedDate(e.target.value)} className={inputCls} />
        </Field>
      )}
      <Field label="Notes">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
      </Field>
      <Field label="Source Reference">
        <input value={sourceRef} onChange={(e) => setSourceRef(e.target.value)} placeholder="e.g. march_2026_statement.pdf" className={inputCls} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
        <button type="submit" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Save</button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:bg-muted disabled:text-muted-foreground";
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label} {required && <span className="text-destructive">*</span>}</span>
      {children}
    </label>
  );
}
