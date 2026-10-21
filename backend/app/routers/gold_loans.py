from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/gold-loans", tags=["gold-loans"])


@router.get("", response_model=list[schemas.GoldLoanOut])
def list_gold_loans(db: Session = Depends(get_db)):
    return db.query(models.GoldLoan).order_by(models.GoldLoan.renewal_due_date).all()


@router.post("", response_model=schemas.GoldLoanOut, status_code=201)
def create_gold_loan(payload: schemas.GoldLoanCreate, db: Session = Depends(get_db)):
    loan = models.GoldLoan(**payload.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@router.get("/alerts/due-soon", response_model=list[schemas.GoldLoanOut])
def due_soon(days: int = 3, db: Session = Depends(get_db)):
    cutoff = date.today() + timedelta(days=days)
    return (
        db.query(models.GoldLoan)
        .filter(models.GoldLoan.is_active.is_(True), models.GoldLoan.renewal_due_date <= cutoff)
        .all()
    )


@router.get("/{loan_id}", response_model=schemas.GoldLoanOut)
def get_gold_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.get(models.GoldLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Gold loan not found")
    return loan


@router.put("/{loan_id}", response_model=schemas.GoldLoanOut)
def update_gold_loan(loan_id: int, payload: schemas.GoldLoanCreate, db: Session = Depends(get_db)):
    loan = db.get(models.GoldLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Gold loan not found")
    for key, value in payload.model_dump().items():
        setattr(loan, key, value)
    db.commit()
    db.refresh(loan)
    return loan


@router.delete("/{loan_id}", status_code=204)
def delete_gold_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.get(models.GoldLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Gold loan not found")
    db.delete(loan)
    db.commit()
