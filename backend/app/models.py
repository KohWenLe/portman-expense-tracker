from sqlalchemy import Column, Integer, String, Float, Boolean, Date, ForeignKey, Text, Enum
from sqlalchemy.orm import relationship
import enum
from app.database import Base

class ProjectStatus(str, enum.Enum):
    active  = "active"
    on_hold = "on_hold"
    closed  = "closed"

class Project(Base):
    __tablename__ = "projects"

    id           = Column(Integer, primary_key=True, index=True)
    name         = Column(String, nullable=False)
    description  = Column(Text, nullable=True)
    start_date   = Column(Date, nullable=True)
    end_date     = Column(Date, nullable=True)
    total_budget = Column(Float, nullable=True)
    status       = Column(Enum(ProjectStatus), default=ProjectStatus.active, nullable=False)

    expenses = relationship("Expense", back_populates="project", cascade="all, delete")
    income   = relationship("Income",  back_populates="project", cascade="all, delete")

class Expense(Base):
    __tablename__ = "expenses"

    id               = Column(Integer, primary_key=True, index=True)
    project_id       = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date             = Column(Date, nullable=False)       # posting date
    trans_date       = Column(Date, nullable=True)        # transaction date (from PDF)
    description      = Column(String, nullable=False)     
    amount           = Column(Float, nullable=False)
    currency         = Column(String(10), default="MYR", nullable=False)
    amount_rm        = Column(Float, nullable=False)      # always in RM (converted if foreign)
    category         = Column(String, nullable=True)
    is_claimed       = Column(Boolean, default=False)
    claimed_date     = Column(Date, nullable=True)
    notes            = Column(Text, nullable=True)
    source_reference = Column(String, nullable=True)      # e.g. "march_2026_statement.pdf"

    # Overseas FX metadata
    original_currency = Column(String(10), nullable=True)
    original_amount   = Column(Float, nullable=True)
    exchange_rate     = Column(Float, nullable=True)

    project = relationship("Project", back_populates="expenses")

class Income(Base):
    __tablename__ = "income"

    id          = Column(Integer, primary_key=True, index=True)
    project_id  = Column(Integer, ForeignKey("projects.id"), nullable=False)
    date        = Column(Date, nullable=False)
    source      = Column(String, nullable=False)
    description = Column(String, nullable=True)
    amount      = Column(Float, nullable=False)
    currency    = Column(String(10), default="MYR", nullable=False)
    amount_rm   = Column(Float, nullable=False)
    notes       = Column(Text, nullable=True)

    project = relationship("Project", back_populates="income")