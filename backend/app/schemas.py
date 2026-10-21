from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.models import (
    AlertChannel,
    AlertStatus,
    ExpenseCategory,
    InterestType,
    RateType,
    TraditionalLoanType,
)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---- Gold Loan ----
class GoldLoanBase(BaseModel):
    lender_name: str
    gram_weight: float
    karat: int
    principal_amount: float
    ltv_ratio: float
    interest_type: InterestType
    interest_rate: float
    start_date: date
    renewal_due_date: date
    notes: str | None = None


class GoldLoanCreate(GoldLoanBase):
    pass


class GoldLoanOut(ORMModel, GoldLoanBase):
    id: int
    is_active: bool


# ---- Chit Fund ----
class ChitFundBase(BaseModel):
    chit_name: str
    foreman_name: str = ""
    total_chit_value: float
    number_of_months: int
    total_members: int = 0
    monthly_installment: float
    foreman_commission_amount: float | None = None
    commission_percent: float = 0.0
    auction_frequency_months: int = 1
    started_on: date | None = None
    auction_date: date
    bid_amount_won: float | None = None
    dividend_amount: float | None = None
    notes: str | None = None


class ChitFundCreate(ChitFundBase):
    pass


class ChitFundOut(ORMModel, ChitFundBase):
    id: int
    is_active: bool
    members_won_count: int = 0
    completed_real_auctions: int = 0


# ---- Chit Members ----
class ChitMemberBase(BaseModel):
    name: str
    mobile_number: str = ""
    has_won: bool = False
    won_month: int | None = None
    won_date: date | None = None
    bid_amount: float | None = None
    participates_in_auction: bool = True
    notes: str | None = None


class ChitMemberCreate(ChitMemberBase):
    pass


class ChitMemberOut(ORMModel, ChitMemberBase):
    id: int
    chit_fund_id: int


# ---- Chit Auction Cycles ----
class ChitCyclePaymentOut(ORMModel):
    id: int
    cycle_id: int
    member_id: int
    amount_due: float
    is_paid: bool
    paid_date: date | None = None


class ChitCyclePaymentUpdate(BaseModel):
    is_paid: bool
    paid_date: date | None = None


class ChitAuctionCycleCreate(BaseModel):
    auction_date: date
    winner_member_id: int
    winning_bid_amount: float
    notes: str | None = None


class ChitAuctionCycleOut(ORMModel):
    id: int
    chit_fund_id: int
    cycle_number: int
    auction_date: date
    winner_member_id: int
    pot_value: float
    winning_bid_amount: float
    discount_amount: float
    commission_amount: float
    dividend_per_member: float
    notes: str | None = None
    payments: list[ChitCyclePaymentOut] = []


# ---- Traditional Loan ----
class TraditionalLoanBase(BaseModel):
    loan_type: TraditionalLoanType
    lender_name: str
    bank_name: str = ""
    principal_amount: float
    moratorium_months: int = 0
    emi_amount: float
    payment_frequency_months: int = 1
    rate_type: RateType
    interest_rate: float
    tenure_months: int
    start_date: date
    outstanding_override: float | None = None
    notes: str | None = None


class TraditionalLoanCreate(TraditionalLoanBase):
    pass


class TraditionalLoanOut(ORMModel, TraditionalLoanBase):
    id: int
    is_active: bool
    payments_completed_count: int = 0
    outstanding_principal: float = 0
    interest_paid_so_far: float = 0
    total_paid_so_far: float = 0
    total_installments: int = 0


# ---- Loan Payments ----
class LoanPaymentOut(ORMModel):
    id: int
    traditional_loan_id: int
    installment_number: int
    due_date: date
    principal_component: float = 0
    interest_component: float = 0
    balance_after: float = 0
    amount: float
    is_paid: bool
    paid_date: date | None = None


class LoanPaymentUpdate(BaseModel):
    is_paid: bool
    paid_date: date | None = None


class RebaseRequest(BaseModel):
    as_of_installment: int
    balance: float


# ---- Budget & Expenses ----
class BudgetPlanBase(BaseModel):
    month: date
    net_income: float


class BudgetPlanCreate(BudgetPlanBase):
    pass


class BudgetPlanOut(ORMModel, BudgetPlanBase):
    id: int


class ExpenseBase(BaseModel):
    budget_plan_id: int
    description: str
    category: ExpenseCategory
    amount: float
    spent_on: date


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseOut(ORMModel, ExpenseBase):
    id: int


# ---- Alerts ----
class AlertBase(BaseModel):
    related_entity_type: str
    related_entity_id: int
    due_date: date
    channel: AlertChannel
    message: str


class AlertCreate(AlertBase):
    pass


class AlertOut(ORMModel, AlertBase):
    id: int
    status: AlertStatus
    created_at: datetime
    sent_at: datetime | None = None


# ---- Analytics ----
class DebtFreeLoanRow(BaseModel):
    id: int
    name: str
    loan_type: str
    interest_rate: float
    balance: float
    principal_amount: float
    pct_paid: float
    monthly_cost: float
    working_clear_date: date
    optimistic_clear_date: date


class FreedUpEvent(BaseModel):
    source: str
    date: date
    amount: float


class GoldLoanSummary(BaseModel):
    id: int
    lender_name: str
    principal_amount: float
    interest_rate: float
    yearly_interest: float
    renewal_due_date: date


class DebtFreePlanResult(BaseModel):
    loans: list[DebtFreeLoanRow]
    working_debt_free_date: date | None
    optimistic_debt_free_date: date | None
    years_saved: float
    priority_target_name: str | None
    priority_target_rate: float | None
    freed_up_events: list[FreedUpEvent]
    gold_loans: list[GoldLoanSummary]
    extra_monthly_applied: float = 0.0


class OpportunityCostResult(BaseModel):
    chit_fund_id: int
    chit_fund_name: str
    gold_loan_id: int
    gold_loan_lender: str
    dividend_amount: float
    gold_loan_monthly_interest: float
    pct_of_interest_covered: float
    recommendation: str
