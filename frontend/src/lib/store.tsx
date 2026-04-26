import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import api from "./api";
import {
  Expense,
  Income,
  Project,
  ParsedTransaction,
  ExpenseCategory,
} from "./mock-data";

// ── Mappers: API response → frontend shape ────────────────────────────────────

function mapProject(p: any): Project {
  return {
    id:          String(p.id),
    name:        p.name,
    description: p.description ?? "",
    startDate:   p.start_date ?? "",
    endDate:     p.end_date ?? "",
    totalBudget: p.total_budget ?? null,
    status:      p.status,
  };
}

function mapExpense(e: any): Expense {
  return {
    id:              String(e.id),
    projectId:       String(e.project_id),
    date:            e.date,
    description:     e.description,
    amount:          e.amount,
    currency:        e.currency ?? "MYR",
    amountRM:        e.amount_rm,
    category:        e.category ?? "Others",
    isClaimed:       e.is_claimed,
    claimedDate:     e.claimed_date ?? undefined,
    notes:           e.notes ?? undefined,
    source:          e.source_reference ? "PDF" : "Manual",
    sourceReference: e.source_reference ?? undefined,
  };
}

function mapIncome(i: any): Income {
  return {
    id:          String(i.id),
    projectId:   String(i.project_id),
    date:        i.date,
    source:      i.source,
    description: i.description ?? "",
    amount:      i.amount,
    currency:    i.currency ?? "MYR",
    amountRM:    i.amount_rm,
    notes:       i.notes ?? undefined,
  };
}

// ── Mappers: frontend shape → API payload ─────────────────────────────────────

function toProjectPayload(p: Omit<Project, "id">) {
  return {
    name:         p.name,
    description:  p.description,
    start_date:   p.startDate   || null,
    end_date:     p.endDate     || null,
    total_budget: p.totalBudget ?? null,
    status:       p.status,
  };
}

function toExpensePayload(e: Omit<Expense, "id">) {
  return {
    date:             e.date,
    description:      e.description,
    amount:           e.amount,
    currency:         e.currency,
    amount_rm:        e.amountRM,
    category:         e.category,
    is_claimed:       e.isClaimed,
    claimed_date:     e.claimedDate  ?? null,
    notes:            e.notes        ?? null,
    source_reference: e.sourceReference ?? null,
  };
}

function toIncomePayload(i: Omit<Income, "id">) {
  return {
    date:        i.date,
    source:      i.source,
    description: i.description ?? null,
    amount:      i.amount,
    currency:    i.currency,
    amount_rm:   i.amountRM,
    notes:       i.notes ?? null,
  };
}

// ── Summary type ──────────────────────────────────────────────────────────────

export interface ProjectSummary {
  totalIncome:      number;
  totalExpenses:    number;
  netPosition:      number;
  totalClaimed:     number;
  totalOutstanding: number;
  budgetRemaining:  number | null;
}

export interface ProjectBreakdownRow {
  category: string;
  claimed: number;
  unclaimed: number;
}

// ── Context interface ─────────────────────────────────────────────────────────

interface StoreCtx {
  projects:   Project[];
  expenses:   Expense[];
  income:     Income[];
  loading:    boolean;
  error:      string | null;

  // Projects
  addProject:    (p: Omit<Project, "id">) => Promise<Project>;
  updateProject: (id: string, p: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProjectSummary: (id: string) => Promise<ProjectSummary>;
  getProjectBreakdown: (id: string) => Promise<ProjectBreakdownRow[]>;

  // Expenses
  addExpense:    (projectId: string, e: Omit<Expense, "id">) => Promise<void>;
  addExpenses:   (projectId: string, es: Omit<Expense, "id">[], sourceRef: string) => Promise<number>;
  updateExpense: (id: string, projectId: string, e: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  toggleClaim:   (id: string, current: boolean) => Promise<void>;
  bulkClaim:     (ids: string[]) => Promise<void>;

  // Income
  addIncome:    (projectId: string, i: Omit<Income, "id">) => Promise<void>;
  updateIncome: (id: string, projectId: string, i: Partial<Income>) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;

  // PDF import
  parsePDF: (file: File) => Promise<{ transactions: ParsedTransaction[]; alreadyImported: boolean }>;
}

const Ctx = createContext<StoreCtx | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function StoreProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [income,   setIncome]   = useState<Income[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  // ── Bootstrap: load all data on mount ──────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      try {
        setLoading(true);
        const projectsRes = await api.get("/projects/");
        const projectList: Project[] = projectsRes.data.map(mapProject);
        setProjects(projectList);

        // Load expenses + income for every project in parallel
        const expenseResults = await Promise.all(
          projectList.map((p) =>
            api.get(`/projects/${p.id}/expenses`).then((r) => r.data.map(mapExpense))
          )
        );
        const incomeResults = await Promise.all(
          projectList.map((p) =>
            api.get(`/projects/${p.id}/income`).then((r) => r.data.map(mapIncome))
          )
        );

        setExpenses(expenseResults.flat());
        setIncome(incomeResults.flat());
      } catch (e: any) {
        setError("Failed to load data from the server. Is the backend running?");
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  // ── Projects ───────────────────────────────────────────────────────────────

  const addProject = useCallback(async (p: Omit<Project, "id">): Promise<Project> => {
    const res = await api.post("/projects/", toProjectPayload(p));
    const np = mapProject(res.data);
    setProjects((prev) => [...prev, np]);
    return np;
  }, []);

  const updateProject = useCallback(async (id: string, p: Partial<Project>) => {
    const payload: any = {};
    if (p.name        !== undefined) payload.name         = p.name;
    if (p.description !== undefined) payload.description  = p.description;
    if (p.startDate   !== undefined) payload.start_date   = p.startDate || null;
    if (p.endDate     !== undefined) payload.end_date     = p.endDate   || null;
    if (p.totalBudget !== undefined) payload.total_budget = p.totalBudget;
    if (p.status      !== undefined) payload.status       = p.status;
    const res = await api.put(`/projects/${id}`, payload);
    setProjects((prev) => prev.map((x) => (x.id === id ? mapProject(res.data) : x)));
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await api.delete(`/projects/${id}`);
    setProjects((prev) => prev.filter((x) => x.id !== id));
    setExpenses((prev) => prev.filter((x) => x.projectId !== id));
    setIncome((prev)   => prev.filter((x) => x.projectId !== id));
  }, []);

  const getProjectSummary = useCallback(async (id: string): Promise<ProjectSummary> => {
    const res = await api.get(`/projects/${id}/summary`);
    const d = res.data;
    return {
      totalIncome:      d.total_income,
      totalExpenses:    d.total_expenses,
      netPosition:      d.net_position,
      totalClaimed:     d.total_claimed,
      totalOutstanding: d.total_outstanding,
      budgetRemaining:  d.budget_remaining ?? null,
    };
  }, []);

  const getProjectBreakdown = useCallback(async (id: string): Promise<ProjectBreakdownRow[]> => {
    const res = await api.get(`/projects/${id}/breakdown`);
    const raw = res.data as Record<string, { claimed?: number; unclaimed?: number }>;
    return Object.entries(raw).map(([category, values]) => ({
      category,
      claimed: values.claimed ?? 0,
      unclaimed: values.unclaimed ?? 0,
    }));
  }, []);

  // ── Expenses ───────────────────────────────────────────────────────────────

  const addExpense = useCallback(async (projectId: string, e: Omit<Expense, "id">) => {
    const res = await api.post(`/projects/${projectId}/expenses`, toExpensePayload(e));
    setExpenses((prev) => [...prev, mapExpense(res.data)]);
  }, []);

  const addExpenses = useCallback(async (
    projectId: string,
    es: Omit<Expense, "id">[],
    sourceRef: string
  ): Promise<number> => {
    // POST /statements/confirm — batch save parsed PDF transactions
    const payload = {
      project_id:       parseInt(projectId),
      source_reference: sourceRef,
      transactions:     es.map((e) => toExpensePayload(e)),
    };
    const res = await api.post("/statements/confirm", payload);
    const saved = res.data.map(mapExpense);
    setExpenses((prev) => [...prev, ...saved]);
    return saved.length;
  }, []);

  const updateExpense = useCallback(async (
    id: string,
    projectId: string,
    e: Partial<Expense>
  ) => {
    const payload: any = {};
    if (e.description      !== undefined) payload.description      = e.description;
    if (e.amount           !== undefined) payload.amount           = e.amount;
    if (e.currency         !== undefined) payload.currency         = e.currency;
    if (e.amountRM         !== undefined) payload.amount_rm        = e.amountRM;
    if (e.category         !== undefined) payload.category         = e.category;
    if (e.isClaimed        !== undefined) payload.is_claimed       = e.isClaimed;
    if (e.claimedDate      !== undefined) payload.claimed_date     = e.claimedDate ?? null;
    if (e.notes            !== undefined) payload.notes            = e.notes ?? null;
    if (e.sourceReference  !== undefined) payload.source_reference = e.sourceReference ?? null;
    const res = await api.put(`/projects/expenses/${id}`, payload);
    setExpenses((prev) => prev.map((x) => (x.id === id ? mapExpense(res.data) : x)));
  }, []);

  const deleteExpense = useCallback(async (id: string) => {
    await api.delete(`/projects/expenses/${id}`);
    setExpenses((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const toggleClaim = useCallback(async (id: string, current: boolean) => {
    const res = await api.patch(
      `/projects/expenses/${id}/claim?is_claimed=${!current}`
    );
    setExpenses((prev) => prev.map((x) => (x.id === id ? mapExpense(res.data) : x)));
  }, []);

  const bulkClaim = useCallback(async (ids: string[]) => {
    const res = await api.patch("/projects/expenses/bulk-claim", {
      expense_ids: ids.map(Number),
      is_claimed:  true,
    });
    const updated: Expense[] = res.data.map(mapExpense);
    setExpenses((prev) =>
      prev.map((x) => updated.find((u) => u.id === x.id) ?? x)
    );
  }, []);

  // ── Income ─────────────────────────────────────────────────────────────────

  const addIncome = useCallback(async (projectId: string, i: Omit<Income, "id">) => {
    const res = await api.post(`/projects/${projectId}/income`, toIncomePayload(i));
    setIncome((prev) => [...prev, mapIncome(res.data)]);
  }, []);

  const updateIncome = useCallback(async (
    id: string,
    projectId: string,
    i: Partial<Income>
  ) => {
    const payload: any = {};
    if (i.date        !== undefined) payload.date        = i.date;
    if (i.source      !== undefined) payload.source      = i.source;
    if (i.description !== undefined) payload.description = i.description ?? null;
    if (i.amount      !== undefined) payload.amount      = i.amount;
    if (i.currency    !== undefined) payload.currency    = i.currency;
    if (i.amountRM    !== undefined) payload.amount_rm   = i.amountRM;
    if (i.notes       !== undefined) payload.notes       = i.notes ?? null;
    const res = await api.put(`/projects/income/${id}`, payload);
    setIncome((prev) => prev.map((x) => (x.id === id ? mapIncome(res.data) : x)));
  }, []);

  const deleteIncome = useCallback(async (id: string) => {
    await api.delete(`/projects/income/${id}`);
    setIncome((prev) => prev.filter((x) => x.id !== id));
  }, []);

  // ── PDF import ─────────────────────────────────────────────────────────────

  const parsePDF = useCallback(async (
    file: File
  ): Promise<{ transactions: ParsedTransaction[]; alreadyImported: boolean }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/statements/parse", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    // Map API parsed rows → ParsedTransaction shape for the review table
    const transactions = res.data.transactions.map((t: any, i: number) => ({
      id:           `t${i}`,
      date:         t.post_date,
      description:  t.description,
      amount:       t.amount,
      currency:     t.currency   as any,
      amountRM:     t.amount_rm,
      exchangeRate: t.exchange_rate   ?? undefined,
      category:     "Others"          as ExpenseCategory,  // user assigns in review step
      selected:     true,
    }));
    return {
      transactions,
      alreadyImported: Boolean(res.data.already_imported),
    };
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────

  const value: StoreCtx = {
    projects, expenses, income, loading, error,
    addProject, updateProject, deleteProject, getProjectSummary, getProjectBreakdown,
    addExpense, addExpenses, updateExpense, deleteExpense, toggleClaim, bulkClaim,
    addIncome, updateIncome, deleteIncome,
    parsePDF,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}