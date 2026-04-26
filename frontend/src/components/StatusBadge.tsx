import { ProjectStatus } from "@/lib/mock-data";

const STYLES: Record<ProjectStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  on_hold: "bg-amber-100 text-amber-800 ring-amber-600/20",
  closed: "bg-gray-200 text-gray-700 ring-gray-500/20",
};

const LABELS: Record<ProjectStatus, string> = {
  active: "Active",
  on_hold: "On Hold",
  closed: "Closed",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}

export function CategoryPill({ category }: { category: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-600/20">
      {category}
    </span>
  );
}
