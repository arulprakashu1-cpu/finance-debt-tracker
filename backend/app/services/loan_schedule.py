"""Generates the installment schedule for a traditional (home/education) loan,
at whatever payment frequency the loan actually uses (monthly, half-yearly, ...).
"""
from datetime import date

from sqlalchemy.orm import Session

from app.models import LoanPayment, TraditionalLoan


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, 28)
    return date(year, month, day)


def ensure_schedule(db: Session, loan: TraditionalLoan) -> list[LoanPayment]:
    existing = (
        db.query(LoanPayment)
        .filter(LoanPayment.traditional_loan_id == loan.id)
        .order_by(LoanPayment.installment_number)
        .all()
    )
    if existing:
        return existing

    freq = loan.payment_frequency_months or 1
    first_due = _add_months(loan.start_date, loan.moratorium_months)
    monthly_rate = loan.interest_rate / 100 / 12
    # Interest that accrues (compounding monthly) over one payment period.
    period_rate = (1 + monthly_rate) ** freq - 1
    balance = loan.principal_amount
    num_payments = max(loan.tenure_months // freq, 1)
    payments = []
    for i in range(num_payments):
        interest_component = round(balance * period_rate, 2)
        principal_component = round(loan.emi_amount - interest_component, 2)
        if principal_component < 0:
            # Installment doesn't even cover the period's interest (negative amortization edge case)
            principal_component = 0
        balance = round(max(balance - principal_component, 0), 2)
        payments.append(
            LoanPayment(
                traditional_loan_id=loan.id,
                installment_number=i + 1,
                due_date=_add_months(first_due, i * freq),
                amount=loan.emi_amount,
                principal_component=principal_component,
                interest_component=interest_component,
                balance_after=balance,
            )
        )
    db.add_all(payments)
    db.commit()
    for p in payments:
        db.refresh(p)
    return payments


def rebase_schedule(
    db: Session, loan: TraditionalLoan, as_of_installment: int, balance: float
) -> list[LoanPayment]:
    """Recompute every installment after `as_of_installment` starting from `balance`,
    leaving installments up to and including `as_of_installment` untouched. Used when
    the real-world balance (from a bank statement) has drifted from the theoretical
    amortization — the past stays as recorded, the future gets rebased to reality.
    """
    ensure_schedule(db, loan)
    all_payments = (
        db.query(LoanPayment)
        .filter(LoanPayment.traditional_loan_id == loan.id)
        .order_by(LoanPayment.installment_number)
        .all()
    )
    future = [p for p in all_payments if p.installment_number > as_of_installment]
    if not future:
        return all_payments

    freq = loan.payment_frequency_months or 1
    monthly_rate = loan.interest_rate / 100 / 12
    period_rate = (1 + monthly_rate) ** freq - 1
    bal = balance
    for p in future:
        interest_component = round(bal * period_rate, 2)
        principal_component = round(loan.emi_amount - interest_component, 2)
        if principal_component < 0:
            principal_component = 0
        bal = round(max(bal - principal_component, 0), 2)
        p.principal_component = principal_component
        p.interest_component = interest_component
        p.balance_after = bal
    db.commit()
    return (
        db.query(LoanPayment)
        .filter(LoanPayment.traditional_loan_id == loan.id)
        .order_by(LoanPayment.installment_number)
        .all()
    )
