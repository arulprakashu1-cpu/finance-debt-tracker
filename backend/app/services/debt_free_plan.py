"""Debt-Free Plan: a plain-language year-by-year roadmap for clearing every
traditional loan, compared two ways —

- **Working Plan**: when each loan clears at its current, unchanged EMI pace.
- **Optimistic Plan**: an avalanche simulation where every rupee freed up
  (a chit fund finishing pays out its monthly installment as free cash, and a
  cleared loan's own EMI rolls forward too) gets redirected to whichever
  active loan has the highest interest rate — the costliest debt per rupee.
"""
from datetime import date

from sqlalchemy.orm import Session

from app.models import ChitFund, GoldLoan, TraditionalLoan
from app.schemas import DebtFreePlanResult, GoldLoanSummary
from app.services.loan_schedule import ensure_schedule

MAX_SIMULATION_MONTHS = 40 * 12


def _add_months(start: date, months: int) -> date:
    month_index = start.month - 1 + months
    year = start.year + month_index // 12
    month = month_index % 12 + 1
    day = min(start.day, 28)
    return date(year, month, day)


def _gold_loan_summaries(db: Session) -> list[GoldLoanSummary]:
    gold_loans = db.query(GoldLoan).filter(GoldLoan.is_active.is_(True)).all()
    summaries = []
    for g in gold_loans:
        summaries.append(
            GoldLoanSummary(
                id=g.id,
                lender_name=g.lender_name,
                principal_amount=g.principal_amount,
                interest_rate=g.interest_rate,
                yearly_interest=round(g.principal_amount * (g.interest_rate / 100), 2),
                renewal_due_date=g.renewal_due_date,
            )
        )
    return summaries


def compute_debt_free_plan(db: Session, extra_monthly: float = 0.0) -> DebtFreePlanResult:
    loans = [
        l
        for l in db.query(TraditionalLoan).filter(TraditionalLoan.is_active.is_(True)).all()
        if l.outstanding_principal > 0
    ]
    if not loans:
        return DebtFreePlanResult(
            loans=[],
            working_debt_free_date=None,
            optimistic_debt_free_date=None,
            years_saved=0.0,
            priority_target_name=None,
            priority_target_rate=None,
            freed_up_events=[],
            gold_loans=_gold_loan_summaries(db),
            extra_monthly_applied=extra_monthly,
        )

    today = date.today()
    chits = db.query(ChitFund).filter(ChitFund.is_active.is_(True)).all()

    loan_rows = []
    for loan in loans:
        schedule = ensure_schedule(db, loan)
        working_clear_date = schedule[-1].due_date if schedule else loan.start_date
        outstanding = loan.outstanding_principal
        pct_paid = (
            round((loan.principal_amount - outstanding) / loan.principal_amount * 100, 1)
            if loan.principal_amount
            else 0.0
        )
        loan_rows.append(
            {
                "id": loan.id,
                "name": loan.bank_name.strip() or loan.lender_name,
                "loan_type": loan.loan_type.value,
                "interest_rate": loan.interest_rate,
                "balance": outstanding,
                "principal_amount": loan.principal_amount,
                "pct_paid": max(min(pct_paid, 100.0), 0.0),
                "monthly_cost": loan.emi_amount / (loan.payment_frequency_months or 1),
                "working_clear_date": working_clear_date,
            }
        )
    working_debt_free_date = max(r["working_clear_date"] for r in loan_rows)

    # A chit fund finishing frees its monthly installment as recurring extra cash,
    # from its estimated completion date onward.
    freed_events = []
    for chit in chits:
        remaining = max((chit.total_members or 0) - chit.completed_real_auctions, 0)
        if remaining <= 0:
            continue
        months_left = remaining * (chit.auction_frequency_months or 1)
        complete_date = _add_months(today, months_left)
        freed_events.append({"source": chit.chit_name, "date": complete_date, "amount": chit.monthly_installment})
    freed_events.sort(key=lambda e: e["date"])

    balances = {r["id"]: r["balance"] for r in loan_rows}
    monthly_costs = {r["id"]: r["monthly_cost"] for r in loan_rows}
    rates = {r["id"]: r["interest_rate"] for r in loan_rows}
    clear_dates: dict[int, date] = {}
    extra_capacity = max(extra_monthly, 0.0)
    freed_idx = 0
    cursor = today

    for i in range(1, MAX_SIMULATION_MONTHS + 1):
        cursor = _add_months(today, i)
        while freed_idx < len(freed_events) and freed_events[freed_idx]["date"] <= cursor:
            extra_capacity += freed_events[freed_idx]["amount"]
            freed_idx += 1

        remaining_ids = [eid for eid, bal in balances.items() if bal > 0]
        if not remaining_ids:
            break
        target_id = max(remaining_ids, key=lambda eid: rates[eid])

        for eid in remaining_ids:
            monthly_rate = rates[eid] / 100 / 12
            interest = balances[eid] * monthly_rate
            min_principal = max(monthly_costs[eid] - interest, 0)
            pay = min_principal + (extra_capacity if eid == target_id else 0)
            new_balance = round(balances[eid] - pay, 2)
            if new_balance <= 0:
                clear_dates[eid] = cursor
                extra_capacity += monthly_costs[eid]
                balances[eid] = 0
            else:
                balances[eid] = new_balance

    optimistic_debt_free_date = max(clear_dates.values()) if clear_dates else working_debt_free_date

    for r in loan_rows:
        r["optimistic_clear_date"] = clear_dates.get(r["id"], r["working_clear_date"])

    years_saved = round((working_debt_free_date - optimistic_debt_free_date).days / 365.25, 1)
    priority_target = max(loan_rows, key=lambda r: r["interest_rate"])

    return DebtFreePlanResult(
        loans=sorted(loan_rows, key=lambda r: -r["interest_rate"]),
        working_debt_free_date=working_debt_free_date,
        optimistic_debt_free_date=optimistic_debt_free_date,
        years_saved=max(years_saved, 0.0),
        priority_target_name=priority_target["name"],
        priority_target_rate=priority_target["interest_rate"],
        freed_up_events=freed_events,
        gold_loans=_gold_loan_summaries(db),
        extra_monthly_applied=extra_monthly,
    )
