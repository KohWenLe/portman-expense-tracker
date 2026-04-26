from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.ProjectOut, status_code=201)
def create_project(payload: schemas.ProjectCreate, db: Session = Depends(get_db)):
    project = models.Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project) 
    return project

@router.get("/", response_model=list[schemas.ProjectOut])
def list_projects(db: Session = Depends(get_db)):
    return db.query(models.Project).all()

@router.get("/{project_id}", response_model=schemas.ProjectOut)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    return project

@router.put("/{project_id}", response_model=schemas.ProjectOut)
def update_project(project_id: int, payload: schemas.ProjectUpdate, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(project, k, v)
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")
    db.delete(project)
    db.commit()

@router.get("/{project_id}/summary", response_model=schemas.ProjectSummary)
def get_project_summary(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    total_income = db.query(func.coalesce(func.sum(models.Income.amount_rm), 0))\
        .filter(models.Income.project_id == project_id).scalar()

    total_expenses = db.query(func.coalesce(func.sum(models.Expense.amount_rm), 0))\
        .filter(models.Expense.project_id == project_id).scalar()

    total_claimed = db.query(func.coalesce(func.sum(models.Expense.amount_rm), 0))\
        .filter(models.Expense.project_id == project_id, models.Expense.is_claimed == True).scalar()

    budget_remaining = None
    if project.total_budget is not None:
        budget_remaining = round(project.total_budget - total_expenses, 2)

    return schemas.ProjectSummary(
        project=project,
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_position=round(total_income - total_expenses, 2),
        total_claimed=round(total_claimed, 2),
        total_outstanding=round(total_expenses - total_claimed, 2),
        budget_remaining=budget_remaining,
    )


@router.get("/{project_id}/breakdown")
def get_category_breakdown(project_id: int, db: Session = Depends(get_db)):
    project = db.get(models.Project, project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    rows = db.query(
        models.Expense.category,
        models.Expense.is_claimed,
        func.sum(models.Expense.amount_rm).label("total"),
    ).filter(
        models.Expense.project_id == project_id
    ).group_by(
        models.Expense.category,
        models.Expense.is_claimed,
    ).all()

    breakdown = {}
    for category, is_claimed, total in rows:
        cat = category or "Uncategorised"
        if cat not in breakdown:
            breakdown[cat] = {"claimed": 0.0, "unclaimed": 0.0}
        key = "claimed" if is_claimed else "unclaimed"
        breakdown[cat][key] = round(total or 0, 2)

    return breakdown