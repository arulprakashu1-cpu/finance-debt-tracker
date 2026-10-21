from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/budget", tags=["budget"])


@router.get("/plans", response_model=list[schemas.BudgetPlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(models.BudgetPlan).order_by(models.BudgetPlan.month.desc()).all()


@router.post("/plans", response_model=schemas.BudgetPlanOut, status_code=201)
def create_plan(payload: schemas.BudgetPlanCreate, db: Session = Depends(get_db)):
    plan = models.BudgetPlan(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@router.post("/expenses", response_model=schemas.ExpenseOut, status_code=201)
def create_expense(payload: schemas.ExpenseCreate, db: Session = Depends(get_db)):
    if not db.get(models.BudgetPlan, payload.budget_plan_id):
        raise HTTPException(404, "Budget plan not found")
    expense = models.Expense(**payload.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@router.get("/plans/{plan_id}/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(plan_id: int, db: Session = Depends(get_db)):
    return db.query(models.Expense).filter(models.Expense.budget_plan_id == plan_id).all()


@router.get("/plans/{plan_id}/burndown")
def burndown(plan_id: int, db: Session = Depends(get_db)):
    plan = db.get(models.BudgetPlan, plan_id)
    if not plan:
        raise HTTPException(404, "Budget plan not found")
    expenses = db.query(models.Expense).filter(models.Expense.budget_plan_id == plan_id).all()
    total_spent = sum(e.amount for e in expenses)
    fixed_needs = sum(e.amount for e in expenses if e.category == models.ExpenseCategory.fixed_need)
    wants = sum(e.amount for e in expenses if e.category == models.ExpenseCategory.want)
    return {
        "net_income": plan.net_income,
        "total_spent": total_spent,
        "remaining": plan.net_income - total_spent,
        "fixed_needs": fixed_needs,
        "wants": wants,
    }
