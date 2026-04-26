import { Link } from "@tanstack/react-router";
import { Home, FolderKanban, Receipt, Wallet, FileUp } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: Home, exact: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/expenses", label: "Expenses", icon: Receipt },
  { to: "/income", label: "Income", icon: Wallet },
  { to: "/import", label: "PDF Import", icon: FileUp },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
            E
          </div>
          <span className="text-lg font-semibold tracking-tight">ExpenseTrack</span>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            activeOptions={{ exact: "exact" in item ? item.exact : false }}
            className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
            activeProps={{
              className:
                "bg-sidebar-accent text-sidebar-accent-foreground font-semibold",
            }}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="px-6 py-4 text-xs text-muted-foreground border-t border-sidebar-border">
        v1.0 · Mock Data
      </div>
    </aside>
  );
}
