from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas import DebtFreePlanResult, OpportunityCostResult
from app.services.debt_free_plan import compute_debt_free_plan
from app.services.opportunity_cost import compute_opportunity_costs

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/opportunity-cost", response_model=list[OpportunityCostResult])
def opportunity_cost(db: Session = Depends(get_db)):
    """Liquid Liquidation & Dividend Optimizer: chit fund dividends vs. gold loan interest."""
    return compute_opportunity_costs(db)


@router.get("/debt-free-plan", response_model=DebtFreePlanResult)
def debt_free_plan(
    extra_monthly: float = Query(0.0, ge=0),
    db: Session = Depends(get_db),
):
    """Working Plan vs Optimistic Plan: when every loan clears, year by year.
    `extra_monthly` lets the UI simulate putting an additional fixed amount
    toward the highest-interest debt every month, on top of whatever chit
    funds free up along the way.
    """
    return compute_debt_free_plan(db, extra_monthly=extra_monthly)
