import { useState, useEffect } from "react";
import { CURRENCIES, Currency, Income, Project } from "@/lib/mock-data";

interface Props {
  initial?: Income;
  projectId?: string;
  projects: Project[];
  onCancel: () => void;
  onSave: (i: Omit<Income, "id">) => void;
}

export function IncomeForm({ initial, projectId, projects, onCancel, onSave }: Props) {
  const [pid, setPid] = useState(initial?.projectId ?? projectId ?? projects[0]?.id ?? "");
  const [date, setDate] = useState(initial?.date ?? new Date().toISOString().slice(0, 10));
  const [source, setSource] = useState(initial?.source ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [amount, setAmount] = useState<string>(initial?.amount.toString() ?? "");
  const [currency, setCurrency] = useState<Currency>(initial?.currency ?? "MYR");
  const [amountRM, setAmountRM] = useState<string>(initial?.amountRM.toString() ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  useEffect(() => {
    if (currency === "MYR") setAmountRM(amount);
  }, [currency, amount]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pid || !source || !amount) return;
    onSave({
      projectId: pid,
      date,
      source,
      description,
      amount: Number(amount),
      currency,
      amountRM: Number(amountRM),
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      {!projectId && (
        <Field label="Project" required>
          <select value={pid} onChange={(e) => setPid(e.target.value)} className={inputCls}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </Field>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date" required>
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Source" required>
          <input required value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Client Invoice" className={inputCls} />
        </Field>
      </div>
      <Field label="Description">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
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
      <Field label="Notes">
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className={inputCls} />
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
