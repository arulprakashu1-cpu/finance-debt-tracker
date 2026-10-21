import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class InterestType(str, enum.Enum):
    simple = "simple"
    compounding = "compounding"


class RateType(str, enum.Enum):
    fixed = "fixed"
    floating = "floating"


class TraditionalLoanType(str, enum.Enum):
    home = "home"
    education = "education"


class ExpenseCategory(str, enum.Enum):
    fixed_need = "fixed_need"
    want = "want"


class AlertChannel(str, enum.Enum):
    sms = "sms"
    whatsapp = "whatsapp"
    email = "email"


class AlertStatus(str, enum.Enum):
    pending = "pending"
    sent = "sent"
    failed = "failed"


class GoldLoan(Base):
    __tablename__ = "gold_loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    lender_name: Mapped[str] = mapped_column(String(255))
    gram_weight: Mapped[float] = mapped_column(Float)
    karat: Mapped[int] = mapped_column(Integer)
    principal_amount: Mapped[float] = mapped_column(Float)
    ltv_ratio: Mapped[float] = mapped_column(Float)
    interest_type: Mapped[InterestType] = mapped_column(Enum(InterestType))
    interest_rate: Mapped[float] = mapped_column(Float)
    start_date: Mapped[date] = mapped_column(Date)
    renewal_due_date: Mapped[date] = mapped_column(Date)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)


class ChitFund(Base):
    __tablename__ = "chit_funds"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chit_name: Mapped[str] = mapped_column(String(255))
    foreman_name: Mapped[str] = mapped_column(String(255), default="")
    total_chit_value: Mapped[float] = mapped_column(Float)
    number_of_months: Mapped[int] = mapped_column(Integer)
    total_members: Mapped[int] = mapped_column(Integer, default=0)
    monthly_installment: Mapped[float] = mapped_column(Float)
    foreman_commission_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    commission_percent: Mapped[float] = mapped_column(Float, default=5.0)
    auction_frequency_months: Mapped[int] = mapped_column(Integer, default=1)
    started_on: Mapped[date | None] = mapped_column(Date, nullable=True)
    auction_date: Mapped[date] = mapped_column(Date)
    bid_amount_won: Mapped[float | None] = mapped_column(Float, nullable=True)
    dividend_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    members: Mapped[list["ChitMember"]] = relationship(
        "ChitMember", back_populates="chit_fund", cascade="all, delete-orphan"
    )
    cycles: Mapped[list["ChitAuctionCycle"]] = relationship(
        "ChitAuctionCycle", back_populates="chit_fund", cascade="all, delete-orphan"
    )

    @property
    def members_won_count(self) -> int:
        return sum(1 for m in self.members if m.has_won)

    @property
    def completed_real_auctions(self) -> int:
        """Count of actual recorded auction cycles — unlike members_won_count,
        this excludes a permanent payer's automatic 'first yelam' (no real
        auction happened for that), so it's the right figure for money math
        like 'how much has actually been disbursed / is still owed'.
        """
        return len(self.cycles)


class ChitMember(Base):
    __tablename__ = "chit_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chit_fund_id: Mapped[int] = mapped_column(ForeignKey("chit_funds.id"))
    name: Mapped[str] = mapped_column(String(255))
    mobile_number: Mapped[str] = mapped_column(String(20), default="")
    has_won: Mapped[bool] = mapped_column(Boolean, default=False)
    won_month: Mapped[int | None] = mapped_column(Integer, nullable=True)
    won_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    bid_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    # A permanent payer slot (e.g. the foreman/owner's own share): always pays the
    # full installment, never bids, never wins, never shares in the dividend.
    participates_in_auction: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    chit_fund: Mapped["ChitFund"] = relationship("ChitFund", back_populates="members")


class ChitAuctionCycle(Base):
    """One auction ('yelam') round: a member wins the pot at a discount, the
    discount splits into foreman commission + a dividend credited to everyone
    else that round, reducing their installment due for this cycle.
    """

    __tablename__ = "chit_auction_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chit_fund_id: Mapped[int] = mapped_column(ForeignKey("chit_funds.id"))
    cycle_number: Mapped[int] = mapped_column(Integer)
    auction_date: Mapped[date] = mapped_column(Date)
    winner_member_id: Mapped[int] = mapped_column(ForeignKey("chit_members.id"))
    pot_value: Mapped[float] = mapped_column(Float)
    winning_bid_amount: Mapped[float] = mapped_column(Float)
    discount_amount: Mapped[float] = mapped_column(Float)
    commission_amount: Mapped[float] = mapped_column(Float)
    dividend_per_member: Mapped[float] = mapped_column(Float)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    chit_fund: Mapped["ChitFund"] = relationship("ChitFund", back_populates="cycles")
    winner: Mapped["ChitMember"] = relationship("ChitMember")
    payments: Mapped[list["ChitCyclePayment"]] = relationship(
        "ChitCyclePayment", back_populates="cycle", cascade="all, delete-orphan"
    )


class ChitCyclePayment(Base):
    """What each member owes (and whether they've paid) for one auction cycle —
    the winner pays the full installment; everyone else pays installment minus
    their dividend share for that round.
    """

    __tablename__ = "chit_cycle_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cycle_id: Mapped[int] = mapped_column(ForeignKey("chit_auction_cycles.id"))
    member_id: Mapped[int] = mapped_column(ForeignKey("chit_members.id"))
    amount_due: Mapped[float] = mapped_column(Float)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    cycle: Mapped["ChitAuctionCycle"] = relationship("ChitAuctionCycle", back_populates="payments")
    member: Mapped["ChitMember"] = relationship("ChitMember")


class TraditionalLoan(Base):
    __tablename__ = "traditional_loans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    loan_type: Mapped[TraditionalLoanType] = mapped_column(Enum(TraditionalLoanType))
    lender_name: Mapped[str] = mapped_column(String(255))
    bank_name: Mapped[str] = mapped_column(String(255), default="")
    principal_amount: Mapped[float] = mapped_column(Float)
    moratorium_months: Mapped[int] = mapped_column(Integer, default=0)
    emi_amount: Mapped[float] = mapped_column(Float)
    payment_frequency_months: Mapped[int] = mapped_column(Integer, default=1)
    rate_type: Mapped[RateType] = mapped_column(Enum(RateType))
    interest_rate: Mapped[float] = mapped_column(Float)
    tenure_months: Mapped[int] = mapped_column(Integer)
    start_date: Mapped[date] = mapped_column(Date)
    outstanding_override: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    payments: Mapped[list["LoanPayment"]] = relationship(
        "LoanPayment", back_populates="loan", cascade="all, delete-orphan"
    )

    @property
    def payments_completed_count(self) -> int:
        return sum(1 for p in self.payments if p.is_paid)

    @property
    def outstanding_principal(self) -> float:
        if self.outstanding_override is not None:
            return self.outstanding_override
        paid = [p for p in self.payments if p.is_paid]
        if not paid:
            return self.principal_amount
        latest = max(paid, key=lambda p: p.installment_number)
        return latest.balance_after

    @property
    def interest_paid_so_far(self) -> float:
        return sum(p.interest_component for p in self.payments if p.is_paid)

    @property
    def total_paid_so_far(self) -> float:
        return sum(p.amount for p in self.payments if p.is_paid)

    @property
    def total_installments(self) -> int:
        return max(self.tenure_months // (self.payment_frequency_months or 1), 1)


class LoanPayment(Base):
    __tablename__ = "loan_payments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    traditional_loan_id: Mapped[int] = mapped_column(ForeignKey("traditional_loans.id"))
    installment_number: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date)
    amount: Mapped[float] = mapped_column(Float)
    principal_component: Mapped[float] = mapped_column(Float, default=0)
    interest_component: Mapped[float] = mapped_column(Float, default=0)
    balance_after: Mapped[float] = mapped_column(Float, default=0)
    is_paid: Mapped[bool] = mapped_column(Boolean, default=False)
    paid_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    loan: Mapped["TraditionalLoan"] = relationship("TraditionalLoan", back_populates="payments")


class BudgetPlan(Base):
    __tablename__ = "budget_plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    month: Mapped[date] = mapped_column(Date)
    net_income: Mapped[float] = mapped_column(Float)


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    budget_plan_id: Mapped[int] = mapped_column(ForeignKey("budget_plans.id"))
    description: Mapped[str] = mapped_column(String(255))
    category: Mapped[ExpenseCategory] = mapped_column(Enum(ExpenseCategory))
    amount: Mapped[float] = mapped_column(Float)
    spent_on: Mapped[date] = mapped_column(Date)

    budget_plan: Mapped["BudgetPlan"] = relationship("BudgetPlan")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    related_entity_type: Mapped[str] = mapped_column(String(50))
    related_entity_id: Mapped[int] = mapped_column(Integer)
    due_date: Mapped[date] = mapped_column(Date)
    channel: Mapped[AlertChannel] = mapped_column(Enum(AlertChannel))
    status: Mapped[AlertStatus] = mapped_column(Enum(AlertStatus), default=AlertStatus.pending)
    message: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
