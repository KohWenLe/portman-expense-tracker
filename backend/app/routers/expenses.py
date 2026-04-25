from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from datetime import date as today_date

router = APIRouter()

@router.post("/{project_id}/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(project_id: int, payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    if not db.get(models.Project, project_id):
        raise HTTPException(404, "Project not found")
    expense = models.Expense(project_id=project_id, **payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense

@router.get("/{project_id}/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(
    project_id: int,
    category: str | None = None,
    is_claimed: bool | None = None,
    db: Session = Depends(get_db)
):
    if not db.get(models.Project, project_id):
        raise HTTPException(404, "Project not found")
    q = db.query(models.Expense).filter(models.Expense.project_id == project_id)
    if category is not None:
        q = q.filter(models.Expense.category == category)
    if is_claimed is not None:
        q = q.filter(models.Expense.is_claimed == is_claimed)
    return q.order_by(models.Expense.post_date).all()

@router.put("/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(expense_id: int, payload: schemas.ExpenseUpdate, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(expense, k, v)
    db.commit()
    db.refresh(expense)
    return expense

@router.patch("/expenses/{expense_id}/claim", response_model=schemas.ExpenseOut)
def toggle_claim(expense_id: int, is_claimed: bool, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    expense.is_claimed   = is_claimed
    expense.claimed_date = today_date.today() if is_claimed else None  # auto-set/clear
    db.commit()
    db.refresh(expense)
    return expense

@router.patch("/expenses/bulk-claim", response_model=list[schemas.ExpenseOut])
def bulk_claim(payload: schemas.BulkClaimRequest, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense)\
        .filter(models.Expense.id.in_(payload.expense_ids)).all()
    if not expenses:
        raise HTTPException(404, "No matching expenses found")
    for e in expenses:
        e.is_claimed   = payload.is_claimed
        e.claimed_date = today_date.today() if payload.is_claimed else None
    db.commit()
    return expenses

@router.delete("/expenses/{expense_id}", status_code=204)
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.get(models.Expense, expense_id)
    if not expense:
        raise HTTPException(404, "Expense not found")
    db.delete(expense)
    db.commit()