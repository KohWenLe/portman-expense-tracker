import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { Modal } from "@/components/Modal";
import { ProjectForm } from "@/components/forms/ProjectForm";
import { StatusBadge } from "@/components/StatusBadge";
import { formatRM, formatDate } from "@/lib/format";
import { Plus, FolderKanban } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";

export const Route = createFileRoute("/projects")({
  head: () => ({ meta: [{ title: "Projects — ExpenseTrack" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const { projects, expenses, addProject } = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(false);

  return (
    <div className="px-8 py-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage all of your active and past projects.</p>
        </div>
        <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 shadow-sm">
          <Plus className="h-4 w-4" /> New Project
        </button>
      </header>

      {projects.length === 0 ? (
        <EmptyState icon={FolderKanban} title="No projects yet" message="Create your first project to start tracking expenses and income." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.map((p) => {
            const spent = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amountRM, 0);
            const pct = p.totalBudget ? Math.min(100, (spent / p.totalBudget) * 100) : 0;
            const over = p.totalBudget != null && spent > p.totalBudget;
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{p.name}</h3>
                    <div className="mt-1"><StatusBadge status={p.status} /></div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{p.description || "No description"}</p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {p.startDate ? formatDate(p.startDate) : "—"} → {p.endDate ? formatDate(p.endDate) : "—"}
                </p>
                {p.totalBudget != null ? (
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{formatRM(spent)} of {formatRM(p.totalBudget)}</span>
                      <span className={`font-medium ${over ? "text-destructive" : "text-muted-foreground"}`}>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full ${over ? "bg-destructive" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 text-xs text-muted-foreground">No budget set</p>
                )}
                <div className="mt-5 flex justify-end">
                  <Link to="/projects/$id" params={{ id: p.id }} className="rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">View Details</Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New Project">
        <ProjectForm
          onCancel={() => setOpen(false)}
          onSave={(p) => {
            addProject(p);
            setOpen(false);
            toast("success", "Project created");
          }}
        />
      </Modal>
    </div>
  );
}
