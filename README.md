# ExpenseTrack — Project Expense & Claim Tracker

A full-stack web application for tracking project income, expenses, and reimbursement claims. Expenses can be entered manually or imported directly from a Malaysian bank credit card statement PDF. Built with a Lovable-generated React frontend wired to a Python FastAPI backend.

---

## Tier Targeted

**Full scope** — all core entities (Project, Expense, Income), PDF ingestion with overseas FX handling, per-project dashboard aggregation, category breakdown, bulk claim toggling, duplicate detection on re-upload, and automated tests.

---

## Architecture Overview

```
┌─────────────────────────────────┐        ┌──────────────────────────────────────┐
│         Frontend (React)        │        │         Backend (FastAPI)            │
│                                 │        │                                      │
│  Lovable-generated UI           │        │  /projects       CRUD + summary      │
│  TanStack Router (navigation)   │◄──────►│  /projects/{id}/expenses  CRUD       │
│  React Context (store.tsx)      │  HTTP  │  /projects/{id}/income    CRUD       │
│  Axios (api.ts)                 │        │  /projects/expenses/{id}/claim       │
│                                 │        │  /projects/expenses/bulk-claim       │
│  Screens:                       │        │  /projects/{id}/breakdown            │
│  • Dashboard                    │        │  /statements/parse                   │
│  • Projects list + detail       │        │  /statements/confirm                 │
│  • Expenses (global + scoped)   │        │                                      │
│  • Income (global + scoped)     │        │  SQLAlchemy ORM → SQLite             │
│  • PDF Import (2-step)          │        │  pdfplumber (PDF parsing)            │
└─────────────────────────────────┘        └──────────────────────────────────────┘
```

**Key design decisions:**

- The frontend store (`src/lib/store.tsx`) is the single integration layer — all API calls live there. Individual screen components are untouched from the Lovable export.
- The backend exposes `/projects/{id}/summary` for aggregate totals and `/projects/{id}/breakdown` for category + claim-status totals, so dashboard math is centralized server-side.
- PDF parsing is a two-step flow: `POST /statements/parse` extracts and returns candidate transactions without saving anything; `POST /statements/confirm` saves only the rows the user approves.

---

## Project Structure

```
/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app, CORS, router registration
│   │   ├── database.py          # SQLAlchemy engine + session
│   │   ├── models.py            # Project, Expense, Income ORM models
│   │   ├── schemas.py           # Pydantic request/response shapes
│   │   ├── routers/
│   │   │   ├── projects.py      # Project CRUD + summary + breakdown
│   │   │   ├── expenses.py      # Expense CRUD + claim toggle + bulk claim
│   │   │   ├── income.py        # Income CRUD
│   │   │   └── statements.py    # PDF parse + confirm endpoints
│   │   └── services/
│   │       └── parser.py        # PDF extraction logic (pdfplumber)
│   ├── tests/
│   │   ├── test_api.py          # API endpoint tests
│   │   ├── test_parser.py       # PDF parser tests
│   │   └── test_dashboard.py    # Dashboard/breakdown tests
│   ├── requirements.txt
│   └── expense_tracker.db       # SQLite database (auto-created on first run)
│
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api.ts           # Axios instance (baseURL config)
│   │   │   ├── store.tsx        # All API calls + React Context state
│   │   │   ├── mock-data.ts     # TypeScript types + seed data (no longer used at runtime)
│   │   │   ├── format.ts        # RM currency + date formatters
│   │   │   └── utils.ts         # Tailwind class helper
│   │   ├── routes/              # TanStack Router screen components
│   │   └── main.tsx
│   └── package.json
│
└── README.md
```

---

## How to Run Locally

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip

### 1 — Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn app.main:app --reload
```

The API will be running at `http://localhost:8000`.
Interactive API docs (Swagger UI) available at `http://localhost:8000/docs`.

The SQLite database (`expense_tracker.db`) is created automatically on first run — no migration step needed.

### 2 — Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The app will be running at `http://localhost:8080`.

> Both servers must be running simultaneously for the app to work.

---

## Environment Variables

This project currently does **not** use environment variable configuration in code.

- Backend DB URL is hardcoded in `backend/app/database.py` as `sqlite:///./expense_tracker.db`.
- Frontend API base URL is hardcoded in `frontend/src/lib/api.ts` as `http://localhost:8000`.

If you want env-based configuration (recommended for deployment), add explicit env reads in those files first.

---

## Running Tests

```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate

# Run all tests
pytest tests/ -v

# Run only parser tests
pytest tests/test_parser.py -v

# Run only API tests
pytest tests/test_api.py -v

# Run only dashboard tests
pytest tests/test_dashboard.py -v

# (Frontend) run unit tests
cd ../frontend
npm test
```

Current backend test suite: **39 tests** (API + parser + dashboard).

Tests use an isolated SQLite test database (`test.db`) and never touch the real `expense_tracker.db`.

---

## PDF Ingestion — Design Decisions

The PDF parser (`app/services/parser.py`) handles the provided Mayhill Bank sample statement with the following rules:

**What is extracted:**
- Every transaction row with a posting date, transaction date, description, and RM amount

**What is filtered out automatically:**
- Rows ending in ` CR` — these are payments/credits back to the card, not expenses
- Zero-amount rows — e.g. waived annual fees
- The Account Summary block (Previous Balance, Finance Charges, Minimum Payment, etc.)
- Column header rows (`Post Date`, `Trans Date`, etc.)
- Sub-Total rows

**What is passed through to the user for review:**
- Bank-imposed charges (Finance Charges, Late Payment, Overseas Transaction Fee) — these are included in the review step and the user decides whether to import them. The parser's job is to extract faithfully, not to make business decisions on the user's behalf.

**Overseas transactions:**
Both the RM amount and the original foreign currency details are stored. Specifically:
- `amount_rm` — the converted RM amount (from the main transaction row)
- `original_currency`, `original_amount`, `exchange_rate` — parsed from the Overseas Transaction Details table at the bottom of the statement

This means the full FX context is preserved for audit purposes, while `amount_rm` is always the canonical amount used for all RM-based calculations and dashboard totals.

**Duplicate detection:**
Re-uploading a statement that overlaps a previous import is handled at the `/statements/confirm` step. A transaction is considered a duplicate if it matches an existing expense on the same project with the same date, description, and RM amount. Duplicates are silently skipped and only new rows are saved. The `/statements/parse` endpoint also returns an `already_imported` flag if the filename has been seen before, which triggers a warning banner in the UI.

---

## Trade-offs

**SQLite over Postgres** — SQLite is sufficient for a take-home assessment and requires zero infrastructure. For production, swapping to Postgres is straightforward with SQLAlchemy, but this repo currently hardcodes SQLite in `backend/app/database.py`, so DB configuration would need to be parameterized first (then migrate with Alembic).

**In-memory frontend state** — The React Context store loads all projects, expenses, and income on mount and keeps them in memory. This is fine for small datasets but would not scale to thousands of records. A production version would use paginated queries and per-screen data fetching (React Query or SWR).

**PDF parser is rule-based** — The parser uses regex patterns tuned specifically for the Mayhill Bank statement format. Different banks format their PDFs differently — a more robust solution would use a layout-aware table extractor or an LLM-assisted extraction step for unknown formats.

**Filename-based duplicate detection** — Duplicate detection uses date + description + amount matching, with filename as a secondary signal. This works well for the same statement re-uploaded but would not catch partial overlaps between two different statements covering the same date range.

---

## What I Would Do With One More Week

1. **Deploy to GCP** — Cloud Run for the FastAPI backend (containerised with Docker), Firebase Hosting for the React frontend, Cloud SQL (Postgres) replacing SQLite.

2. **Paginated API responses** — The expenses endpoint currently returns all rows. For projects with hundreds of transactions, server-side pagination with limit/offset would be necessary.

3. **Smarter PDF parser** — Use pdfplumber's table extraction (`page.extract_tables()`) in addition to text extraction to handle PDFs with more complex layouts. Potentially add an LLM fallback for unknown bank formats.

4. **Attachment storage** — Store the original PDF in GCS and link it to the imported expenses via `source_reference`, so users can view the original statement from within the app.

5. **Export to CSV/Excel** — Allow users to export filtered expense lists for use in external accounting tools.

---

## AI Assistant Usage

AI tooling was used to speed up development, mainly for scaffolding, boilerplate code, and generating initial test cases.

It assisted with:

Setting up the FastAPI structure, models, and schemas
Drafting API endpoints and test cases
Iterating on parts of the PDF parsing logic
Crafting initial prompt for lovable generation
Adapting the frontend integration layer (store.tsx)
Generate comprehensive README.md

All outputs were reviewed and adjusted. Key decisions—such as PDF parsing rules, data model completeness, and API design—were validated and refined manually.

---

## API Reference (Summary)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/projects/` | List all projects |
| POST | `/projects/` | Create project |
| GET | `/projects/{id}` | Get project |
| PUT | `/projects/{id}` | Update project |
| DELETE | `/projects/{id}` | Delete project |
| GET | `/projects/{id}/summary` | Aggregated totals (income, expenses, net, claimed, outstanding, budget) |
| GET | `/projects/{id}/breakdown` | Expense totals grouped by category and claim status |
| GET | `/projects/{id}/expenses` | List expenses (filterable by category, claim status) |
| POST | `/projects/{id}/expenses` | Create expense |
| PUT | `/projects/expenses/{id}` | Update expense |
| DELETE | `/projects/expenses/{id}` | Delete expense |
| PATCH | `/projects/expenses/{id}/claim` | Toggle claim status (single) |
| PATCH | `/projects/expenses/bulk-claim` | Toggle claim status (bulk) |
| GET | `/projects/{id}/income` | List income |
| POST | `/projects/{id}/income` | Create income |
| PUT | `/projects/income/{id}` | Update income |
| DELETE | `/projects/income/{id}` | Delete income |
| POST | `/statements/parse` | Upload PDF → returns candidate transactions (nothing saved) |
| POST | `/statements/confirm` | Save confirmed transactions to a project |
