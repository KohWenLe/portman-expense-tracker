export type ProjectStatus = "active" | "on_hold" | "closed";
export type Currency = "MYR" | "USD" | "EUR" | "GBP" | "SGD";
export type ExpenseCategory =
  | "Transport"
  | "Food"
  | "Accommodation"
  | "Utilities"
  | "Software"
  | "Hardware"
  | "Marketing"
  | "Others";

export interface Project {
  id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  totalBudget: number | null;
  status: ProjectStatus;
}

export interface Expense {
  id: string;
  projectId: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  amountRM: number;
  category: ExpenseCategory;
  isClaimed: boolean;
  claimedDate?: string;
  notes?: string;
  source: "PDF" | "Manual";
  sourceReference?: string;
}

export interface Income {
  id: string;
  projectId: string;
  date: string;
  source: string;
  description: string;
  amount: number;
  currency: Currency;
  amountRM: number;
  notes?: string;
}

export const CATEGORIES: ExpenseCategory[] = [
  "Transport",
  "Food",
  "Accommodation",
  "Utilities",
  "Software",
  "Hardware",
  "Marketing",
  "Others",
];

export const CURRENCIES: Currency[] = ["MYR", "USD", "EUR", "GBP", "SGD"];

export const initialProjects: Project[] = [
  {
    id: "p1",
    name: "Client A Website",
    description:
      "Full redesign and rebuild of the corporate website for Client A, including CMS migration, SEO optimisation, and a new design system.",
    startDate: "2026-01-15",
    endDate: "2026-06-30",
    totalBudget: 50000,
    status: "active",
  },
  {
    id: "p2",
    name: "Office Renovation",
    description:
      "Renovation of the KL office: new meeting rooms, refreshed lighting, ergonomic desks, and a small pantry upgrade.",
    startDate: "2026-02-01",
    endDate: "2026-04-15",
    totalBudget: 15000,
    status: "on_hold",
  },
  {
    id: "p3",
    name: "Annual Conference",
    description:
      "Hosting the annual partner conference with keynote sessions, breakout tracks, dinner reception, and travel arrangements.",
    startDate: "2025-09-01",
    endDate: "2025-12-15",
    totalBudget: 30000,
    status: "closed",
  },
];

export const initialExpenses: Expense[] = [
  {
    id: "e1",
    projectId: "p1",
    date: "2026-03-04",
    description: "Figma Organisation Plan",
    amount: 75,
    currency: "USD",
    amountRM: 354.75,
    category: "Software",
    isClaimed: true,
    claimedDate: "2026-03-10",
    notes: "Annual seat for design team",
    source: "PDF",
    sourceReference: "march_2026_statement.pdf",
  },
  {
    id: "e2",
    projectId: "p1",
    date: "2026-03-12",
    description: "Grab to client meeting",
    amount: 28.5,
    currency: "MYR",
    amountRM: 28.5,
    category: "Transport",
    isClaimed: false,
    source: "Manual",
  },
  {
    id: "e3",
    projectId: "p1",
    date: "2026-03-18",
    description: "Vercel Pro hosting",
    amount: 20,
    currency: "USD",
    amountRM: 94.6,
    category: "Software",
    isClaimed: true,
    claimedDate: "2026-03-25",
    source: "PDF",
    sourceReference: "march_2026_statement.pdf",
  },
  {
    id: "e4",
    projectId: "p2",
    date: "2026-02-08",
    description: "IKEA office desks (x6)",
    amount: 4200,
    currency: "MYR",
    amountRM: 4200,
    category: "Hardware",
    isClaimed: false,
    notes: "Pending approval from finance",
    source: "Manual",
  },
  {
    id: "e5",
    projectId: "p2",
    date: "2026-02-14",
    description: "Electrical contractor",
    amount: 6800,
    currency: "MYR",
    amountRM: 6800,
    category: "Utilities",
    isClaimed: true,
    claimedDate: "2026-02-20",
    source: "Manual",
  },
  {
    id: "e6",
    projectId: "p2",
    date: "2026-02-22",
    description: "Lunch — site visit team",
    amount: 142,
    currency: "MYR",
    amountRM: 142,
    category: "Food",
    isClaimed: false,
    source: "Manual",
  },
  {
    id: "e7",
    projectId: "p3",
    date: "2025-11-04",
    description: "Conference venue deposit",
    amount: 12000,
    currency: "MYR",
    amountRM: 12000,
    category: "Accommodation",
    isClaimed: true,
    claimedDate: "2025-11-12",
    source: "Manual",
  },
  {
    id: "e8",
    projectId: "p3",
    date: "2025-11-20",
    description: "Printed banners & signage",
    amount: 1850,
    currency: "MYR",
    amountRM: 1850,
    category: "Marketing",
    isClaimed: true,
    claimedDate: "2025-11-28",
    source: "Manual",
  },
  {
    id: "e9",
    projectId: "p3",
    date: "2025-11-25",
    description: "Speaker travel — flights",
    amount: 8400,
    currency: "MYR",
    amountRM: 8400,
    category: "Transport",
    isClaimed: false,
    notes: "Awaiting receipts from 2 speakers",
    source: "Manual",
  },
  {
    id: "e10",
    projectId: "p3",
    date: "2025-12-02",
    description: "Catering — gala dinner",
    amount: 6500,
    currency: "MYR",
    amountRM: 6500,
    category: "Food",
    isClaimed: true,
    claimedDate: "2025-12-08",
    source: "Manual",
  },
];

export const initialIncome: Income[] = [
  {
    id: "i1",
    projectId: "p1",
    date: "2026-02-01",
    source: "Client A",
    description: "Phase 1 invoice",
    amount: 20000,
    currency: "MYR",
    amountRM: 20000,
  },
  {
    id: "i2",
    projectId: "p3",
    date: "2025-09-15",
    source: "Sponsor — TechCorp",
    description: "Gold sponsorship",
    amount: 18000,
    currency: "MYR",
    amountRM: 18000,
  },
  {
    id: "i3",
    projectId: "p3",
    date: "2025-10-10",
    source: "Ticket sales",
    description: "Early-bird batch",
    amount: 12000,
    currency: "MYR",
    amountRM: 12000,
  },
  {
    id: "i4",
    projectId: "p1",
    date: "2026-03-20",
    source: "Refund",
    description: "Unused stock photo credits",
    amount: 120,
    currency: "USD",
    amountRM: 567.6,
    notes: "Refunded to AmEx",
  },
];

export interface ParsedTransaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  currency: Currency;
  amountRM: number;
  exchangeRate?: number;
  category: ExpenseCategory;
  selected: boolean;
}

export const mockParsedTransactions: ParsedTransaction[] = [
  {
    id: "t1",
    date: "2026-03-02",
    description: "GRAB*RIDE KL",
    amount: 32.4,
    currency: "MYR",
    amountRM: 32.4,
    category: "Transport",
    selected: true,
  },
  {
    id: "t2",
    date: "2026-03-05",
    description: "AWS SERVICES",
    amount: 95.2,
    currency: "USD",
    amountRM: 450.3,
    exchangeRate: 4.73,
    category: "Software",
    selected: true,
  },
  {
    id: "t3",
    date: "2026-03-09",
    description: "STARBUCKS BANGSAR",
    amount: 24.9,
    currency: "MYR",
    amountRM: 24.9,
    category: "Food",
    selected: true,
  },
  {
    id: "t4",
    date: "2026-03-14",
    description: "GITHUB ENTERPRISE",
    amount: 21.0,
    currency: "USD",
    amountRM: 99.33,
    exchangeRate: 4.73,
    category: "Software",
    selected: true,
  },
  {
    id: "t5",
    date: "2026-03-18",
    description: "SHELL PETROL KL",
    amount: 110.0,
    currency: "MYR",
    amountRM: 110.0,
    category: "Transport",
    selected: true,
  },
  {
    id: "t6",
    date: "2026-03-22",
    description: "FACEBOOK ADS",
    amount: 320.5,
    currency: "MYR",
    amountRM: 320.5,
    category: "Marketing",
    selected: true,
  },
];
