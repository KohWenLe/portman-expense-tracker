from pydantic import BaseModel, Field, ConfigDict  
from datetime import date
from typing import Optional, List
from app.models import ProjectStatus

# ── Project ──────────────────────────────────────────────
class ProjectCreate(BaseModel):
    name:         str
    description:  Optional[str]   = None
    start_date:   Optional[date]  = None
    end_date:     Optional[date]  = None
    total_budget: Optional[float] = None
    status:       ProjectStatus   = ProjectStatus.active

class ProjectUpdate(BaseModel):
    name:         Optional[str]           = None
    description:  Optional[str]           = None
    start_date:   Optional[date]          = None
    end_date:     Optional[date]          = None
    total_budget: Optional[float]         = None
    status:       Optional[ProjectStatus] = None

class ProjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  

    id:           int
    name:         str
    description:  Optional[str]
    start_date:   Optional[date]
    end_date:     Optional[date]
    total_budget: Optional[float]
    status:       ProjectStatus

class ProjectSummary(BaseModel):
    project:           ProjectOut
    total_income:      float
    total_expenses:    float
    net_position:      float
    total_claimed:     float
    total_outstanding: float
    budget_remaining:  Optional[float] = None

# ── Expense ───────────────────────────────────────────────
class ExpenseCreate(BaseModel):
    date:             date
    trans_date:       Optional[date]  = None
    description:      str
    amount:           float = Field(gt=0)
    currency:         str   = "MYR"
    amount_rm:        float = Field(gt=0)
    category:         Optional[str]   = None
    notes:            Optional[str]   = None
    source_reference: Optional[str]   = None
    original_currency: Optional[str]  = None
    original_amount:   Optional[float] = None
    exchange_rate:     Optional[float] = None

class ExpenseUpdate(BaseModel):
    description:      Optional[str]   = None
    amount:           Optional[float] = None
    currency:         Optional[str]   = None
    amount_rm:        Optional[float] = None
    category:         Optional[str]   = None
    is_claimed:       Optional[bool]  = None
    claimed_date:     Optional[date]  = None
    notes:            Optional[str]   = None
    source_reference: Optional[str]   = None

class ExpenseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)  

    id:               int
    project_id:       int
    date:             date
    trans_date:       Optional[date]
    description:      str
    amount:           float
    currency:         str
    amount_rm:        float
    category:         Optional[str]
    is_claimed:       bool
    claimed_date:     Optional[date]
    notes:            Optional[str]
    source_reference: Optional[str]
    original_currency: Optional[str]
    original_amount:   Optional[float]
    exchange_rate:     Optional[float]

class BulkClaimRequest(BaseModel):
    expense_ids: List[int]
    is_claimed:  bool

# ── Income ────────────────────────────────────────────────
class IncomeCreate(BaseModel):
    date:        date
    source:      str
    description: Optional[str]  = None
    amount:      float = Field(gt=0)
    currency:    str   = "MYR"
    amount_rm:   float = Field(gt=0)
    notes:       Optional[str]  = None

class IncomeUpdate(BaseModel):
    date:        Optional[date]  = None
    source:      Optional[str]   = None
    description: Optional[str]   = None
    amount:      Optional[float] = None
    currency:    Optional[str]   = None
    amount_rm:   Optional[float] = None
    notes:       Optional[str]   = None

class IncomeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True) 

    id:          int
    project_id:  int
    date:        date
    source:      str
    description: Optional[str]
    amount:      float
    currency:    str
    amount_rm:   float
    notes:       Optional[str]