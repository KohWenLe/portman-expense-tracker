import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { formatRM } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { FolderKanban, Receipt, Wallet, Hourglass, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — ExpenseTrack" }],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { projects, expenses, income } = useStore();

  const totalExpenses = expenses.reduce((s, e) => s + e.amountRM, 0);
  const totalIncome = income.reduce((s, i) => s + i.amountRM, 0);
  const outstanding = expenses.filter((e) => !e.isClaimed).reduce((s, e) => s + e.amountRM, 0);

  return (
    <div className="px-8 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of all your projects and reimbursements.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Projects" value={projects.length.toString()} icon={FolderKanban} />
        <StatCard label="Total Expenses" value={formatRM(totalExpenses)} icon={Receipt} />
        <StatCard label="Total Income" value={formatRM(totalIncome)} icon={Wallet} tone="positive" />
        <StatCard label="Outstanding Claims" value={formatRM(outstanding)} icon={Hourglass} tone={outstanding > 0 ? "negative" : "default"} />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-semibold">Projects</h2>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-6 py-3 text-left">Project Name</th>
                <th className="px-3 py-3 text-left">Status</th>
                <th className="px-3 py-3 text-right">Budget</th>
                <th className="px-3 py-3 text-right">Expenses</th>
                <th className="px-3 py-3 text-right">Income</th>
                <th className="px-3 py-3 text-right">Net Position</th>
                <th className="px-3 py-3 text-right">Outstanding</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projects.map((p) => {
                const exp = expenses.filter((e) => e.projectId === p.id).reduce((s, e) => s + e.amountRM, 0);
                const inc = income.filter((i) => i.projectId === p.id).reduce((s, i) => s + i.amountRM, 0);
                const out = expenses.filter((e) => e.projectId === p.id && !e.isClaimed).reduce((s, e) => s + e.amountRM, 0);
                const net = inc - exp;
                return (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-3 py-4"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-4 text-right tabular-nums">{p.totalBudget != null ? formatRM(p.totalBudget) : "—"}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{formatRM(exp)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{formatRM(inc)}</td>
                    <td className={`px-3 py-4 text-right tabular-nums font-semibold ${net >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatRM(net)}</td>
                    <td className="px-3 py-4 text-right tabular-nums">{formatRM(out)}</td>
                    <td className="px-6 py-4 text-right">
                      <Link to="/projects/$id" params={{ id: p.id }} className="text-sm font-medium text-primary hover:underline">View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
