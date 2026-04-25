from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.post("/{project_id}/income", response_model=schemas.IncomeOut, status_code=201)
def create_income(project_id: int, payload: schemas.IncomeCreate, db: Session = Depends(get_db)):
    if not db.get(models.Project, project_id):
        raise HTTPException(404, "Project not found")
    income = models.Income(project_id=project_id, **payload.model_dump())
    db.add(income)
    db.commit()
    db.refresh(income)
    return income

@router.get("/{project_id}/income", response_model=list[schemas.IncomeOut])
def list_income(project_id: int, db: Session = Depends(get_db)):
    if not db.get(models.Project, project_id):
        raise HTTPException(404, "Project not found")
    return db.query(models.Income)\
        .filter(models.Income.project_id == project_id)\
        .order_by(models.Income.date).all()

@router.put("/income/{income_id}", response_model=schemas.IncomeOut)
def update_income(income_id: int, payload: schemas.IncomeUpdate, db: Session = Depends(get_db)):
    income = db.get(models.Income, income_id)
    if not income:
        raise HTTPException(404, "Income not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(income, k, v)
    db.commit()
    db.refresh(income)
    return income

@router.delete("/income/{income_id}", status_code=204)
def delete_income(income_id: int, db: Session = Depends(get_db)):
    income = db.get(models.Income, income_id)
    if not income:
        raise HTTPException(404, "Income not found")
    db.delete(income)
    db.commit()