import { useState } from "react";
import { Project, ProjectStatus } from "@/lib/mock-data";

interface Props {
  initial?: Project;
  onCancel: () => void;
  onSave: (p: Omit<Project, "id">) => void;
}

export function ProjectForm({ initial, onCancel, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [totalBudget, setTotalBudget] = useState<string>(
    initial?.totalBudget?.toString() ?? "",
  );
  const [status, setStatus] = useState<ProjectStatus>(initial?.status ?? "active");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      description,
      startDate,
      endDate,
      totalBudget: totalBudget ? Number(totalBudget) : null,
      status,
    });
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Name" required>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputCls}
        />
      </Field>
      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={inputCls}
        />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Start Date">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="End Date">
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className={inputCls}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Total Budget (RM)">
          <input
            type="number"
            step="0.01"
            value={totalBudget}
            onChange={(e) => setTotalBudget(e.target.value)}
            className={inputCls}
          />
        </Field>
        <Field label="Status">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={inputCls}
          >
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="closed">Closed</option>
          </select>
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Save
        </button>
      </div>
    </form>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </span>
      {children}
    </label>
  );
}
