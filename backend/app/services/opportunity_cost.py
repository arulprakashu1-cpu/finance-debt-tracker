"""Liquid Liquidation & Dividend Optimizer.

Compares upcoming chit fund dividends against the highest-interest active
gold loan (education loans could be added the same way later) and tells the
user how much of that loan's monthly interest the dividend could clear.
"""
from sqlalchemy.orm import Session

from app.models import ChitFund, GoldLoan
from app.schemas import OpportunityCostResult


def _monthly_interest(loan: GoldLoan) -> float:
    annual_rate = loan.interest_rate / 100
    if loan.interest_type.value == "compounding":
        monthly_rate = (1 + annual_rate) ** (1 / 12) - 1
    else:
        monthly_rate = annual_rate / 12
    return loan.principal_amount * monthly_rate


def _latest_dividend(chit: ChitFund) -> float | None:
    """Prefer the most recent auction cycle's per-member dividend; fall back to
    the legacy flat `dividend_amount` field for chits entered before cycles existed.
    """
    if chit.cycles:
        latest = max(chit.cycles, key=lambda c: c.cycle_number)
        return latest.dividend_per_member
    return chit.dividend_amount


def compute_opportunity_costs(db: Session) -> list[OpportunityCostResult]:
    gold_loans = db.query(GoldLoan).filter(GoldLoan.is_active.is_(True)).all()
    if not gold_loans:
        return []

    chit_funds = db.query(ChitFund).filter(ChitFund.is_active.is_(True)).all()
    highest_interest_loan = max(gold_loans, key=lambda l: l.interest_rate)
    monthly_interest = _monthly_interest(highest_interest_loan)

    results: list[OpportunityCostResult] = []
    for chit in chit_funds:
        dividend = _latest_dividend(chit)
        if dividend is None:
            continue
        pct_covered = (
            round((dividend / monthly_interest) * 100, 2) if monthly_interest > 0 else 0.0
        )
        recommendation = (
            f"Your dividend from {chit.chit_name} this month can clear "
            f"{pct_covered}% of your {highest_interest_loan.lender_name} gold loan "
            f"interest, saving you approximately {round(min(dividend, monthly_interest), 2)} "
            "in compounding interest."
        )
        results.append(
            OpportunityCostResult(
                chit_fund_id=chit.id,
                chit_fund_name=chit.chit_name,
                gold_loan_id=highest_interest_loan.id,
                gold_loan_lender=highest_interest_loan.lender_name,
                dividend_amount=dividend,
                gold_loan_monthly_interest=round(monthly_interest, 2),
                pct_of_interest_covered=pct_covered,
                recommendation=recommendation,
            )
        )
    return results
