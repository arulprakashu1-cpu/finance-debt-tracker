from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.loan_schedule import ensure_schedule, rebase_schedule

router = APIRouter(prefix="/traditional-loans", tags=["traditional-loans"])


@router.get("", response_model=list[schemas.TraditionalLoanOut])
def list_traditional_loans(db: Session = Depends(get_db)):
    return db.query(models.TraditionalLoan).order_by(models.TraditionalLoan.start_date).all()


@router.post("", response_model=schemas.TraditionalLoanOut, status_code=201)
def create_traditional_loan(payload: schemas.TraditionalLoanCreate, db: Session = Depends(get_db)):
    loan = models.TraditionalLoan(**payload.model_dump())
    db.add(loan)
    db.commit()
    db.refresh(loan)
    return loan


@router.get("/{loan_id}", response_model=schemas.TraditionalLoanOut)
def get_traditional_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    return loan


@router.put("/{loan_id}", response_model=schemas.TraditionalLoanOut)
def update_traditional_loan(
    loan_id: int, payload: schemas.TraditionalLoanCreate, db: Session = Depends(get_db)
):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    schedule_affecting = {
        "start_date",
        "tenure_months",
        "moratorium_months",
        "emi_amount",
        "interest_rate",
        "principal_amount",
        "payment_frequency_months",
    }
    data = payload.model_dump()
    needs_regeneration = any(getattr(loan, key) != data[key] for key in schedule_affecting)
    for key, value in data.items():
        setattr(loan, key, value)
    if needs_regeneration:
        db.query(models.LoanPayment).filter(models.LoanPayment.traditional_loan_id == loan_id).delete()
    db.commit()
    db.refresh(loan)
    return loan


@router.delete("/{loan_id}", status_code=204)
def delete_traditional_loan(loan_id: int, db: Session = Depends(get_db)):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    db.delete(loan)
    db.commit()


# ---- Payment Schedule ----
@router.get("/{loan_id}/payments", response_model=list[schemas.LoanPaymentOut])
def list_payments(loan_id: int, db: Session = Depends(get_db)):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    return ensure_schedule(db, loan)


@router.put("/payments/{payment_id}", response_model=schemas.LoanPaymentOut)
def update_payment(payment_id: int, payload: schemas.LoanPaymentUpdate, db: Session = Depends(get_db)):
    payment = db.get(models.LoanPayment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    payment.is_paid = payload.is_paid
    payment.paid_date = payload.paid_date if payload.is_paid else None
    if payload.is_paid and not payment.paid_date:
        payment.paid_date = date.today()
    db.commit()
    db.refresh(payment)
    return payment


@router.post("/{loan_id}/rebase", response_model=list[schemas.LoanPaymentOut])
def rebase(loan_id: int, payload: schemas.RebaseRequest, db: Session = Depends(get_db)):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    return rebase_schedule(db, loan, payload.as_of_installment, payload.balance)


@router.post("/{loan_id}/payments/mark-paid-through/{installment_number}", response_model=list[schemas.LoanPaymentOut])
def mark_paid_through(loan_id: int, installment_number: int, db: Session = Depends(get_db)):
    loan = db.get(models.TraditionalLoan, loan_id)
    if not loan:
        raise HTTPException(404, "Loan not found")
    payments = ensure_schedule(db, loan)
    for p in payments:
        if p.installment_number <= installment_number:
            p.is_paid = True
            p.paid_date = p.paid_date or p.due_date
        else:
            p.is_paid = False
            p.paid_date = None
    db.commit()
    return (
        db.query(models.LoanPayment)
        .filter(models.LoanPayment.traditional_loan_id == loan_id)
        .order_by(models.LoanPayment.installment_number)
        .all()
    )
