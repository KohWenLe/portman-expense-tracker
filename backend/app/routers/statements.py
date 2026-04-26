from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.parser import parse_statement
from app import models, schemas
from datetime import date
from typing import List
from pydantic import BaseModel

router = APIRouter()


class ConfirmPayload(BaseModel):
    project_id:      int
    source_reference: str
    transactions:    List[schemas.ExpenseCreate]


@router.post("/parse")
async def parse_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Step 1 — Upload a PDF, get back parsed transactions for review.
    Nothing is saved to the DB yet.
    """
    if not file.filename.endswith(".pdf"):
        raise HTTPException(400, "Only PDF files are accepted")

    pdf_bytes = await file.read()
    if not pdf_bytes:
        raise HTTPException(400, "Uploaded file is empty")

    previous = db.query(models.Expense).filter(
        models.Expense.source_reference == file.filename
    ).first()
    already_imported = previous is not None

    try:
        transactions = parse_statement(pdf_bytes)
    except Exception as e:
        raise HTTPException(422, f"Failed to parse PDF: {str(e)}")

    return {
        "filename":         file.filename,
        "transaction_count": len(transactions),
        "transactions":     transactions,
        "already_imported": already_imported,
    }


@router.post("/confirm", response_model=list[schemas.ExpenseOut])
def confirm_transactions(payload: ConfirmPayload, db: Session = Depends(get_db)):
    """
    Step 2 — Save the confirmed (user-reviewed) transactions to a project.
    Frontend sends back only the rows the user wants to keep.
    """
    project = db.get(models.Project, payload.project_id)
    if not project:
        raise HTTPException(404, "Project not found")

    saved = []
    for txn in payload.transactions:
        data = txn.model_dump()
        # Rename post_date → date if frontend sends post_date
        if "post_date" in data and "date" not in data:
            data["date"] = data.pop("post_date")
        existing = db.query(models.Expense).filter(
            models.Expense.project_id == payload.project_id,
            models.Expense.date == data["date"],
            models.Expense.description == data["description"],
            models.Expense.amount_rm == data["amount_rm"],
        ).first()
        if existing:
            continue

        data["source_reference"] = payload.source_reference

        expense = models.Expense(project_id=payload.project_id, **data)
        db.add(expense)
        saved.append(expense)

    db.commit()
    for e in saved:
        db.refresh(e)

    return saved