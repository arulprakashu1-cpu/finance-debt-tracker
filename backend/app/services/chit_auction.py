"""Tamil Nadu 'yelam' (auction) style chit fund mechanics.

Each cycle, one not-yet-won member wins the pot at a discount (the gap
between the full chit value and their winning bid). The ENTIRE discount is
credited as a dividend to every member who has NOT won yet (this cycle's
winner included in that pool one last time — they're about to leave it).
Once a member wins, they drop out of future dividend rounds: they keep
paying the full installment, but no longer earn a share, since they've
already received their lump sum. So the dividend pool shrinks by one member
every cycle. Total collected from everyone this cycle (winner's full
installment + each dividend recipient's discounted installment) always
equals the winning bid — that's what funds the payout.

A member can also be marked `participates_in_auction = False` — a permanent
payer slot (typically the foreman/owner's own share): they always pay the
full installment but never bid, never win, and never share in the dividend.
They're excluded from the dividend pool entirely, from the first cycle on.

`commission_percent` is tracked purely as a reference figure (e.g. for the
organizer's own bookkeeping of what a standard cut would look like) — it is
NOT subtracted from the dividend pool.
"""
from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import ChitAuctionCycle, ChitCyclePayment, ChitFund, ChitMember


def create_cycle(
    db: Session,
    chit: ChitFund,
    auction_date: date,
    winner_member_id: int,
    winning_bid_amount: float,
    notes: str | None = None,
) -> ChitAuctionCycle:
    winner = db.get(ChitMember, winner_member_id)
    if not winner or winner.chit_fund_id != chit.id:
        raise HTTPException(404, "Member not found in this chit fund")
    if winner.has_won:
        raise HTTPException(400, "This member has already won an earlier auction")
    if not winner.participates_in_auction:
        raise HTTPException(400, "This member has a permanent payer slot and can't bid or win")

    members = list(chit.members)
    if len(members) < 2:
        raise HTTPException(400, "Need at least 2 members to run an auction")

    pot_value = chit.total_chit_value
    discount_amount = round(pot_value - winning_bid_amount, 2)
    if discount_amount < 0:
        raise HTTPException(400, "Winning bid can't exceed the total chit value")

    # Reference only — not subtracted from the dividend pool (see module docstring).
    commission_amount = round(discount_amount * (chit.commission_percent / 100), 2)
    dividend_pool = discount_amount
    # Dividend recipients this cycle: auction-eligible members who have not won
    # before AND are not winning right now — this cycle's winner already got their
    # benefit as the discounted payout, members who won an earlier auction stopped
    # earning a dividend the moment they won, and permanent payer slots (foreman's
    # own share) never earn a dividend at all. The pool shrinks by one every cycle.
    dividend_recipients = [
        m
        for m in members
        if m.participates_in_auction and not m.has_won and m.id != winner_member_id
    ]
    dividend_per_member = (
        round(dividend_pool / len(dividend_recipients), 2) if dividend_recipients else 0.0
    )

    existing_cycles = db.query(ChitAuctionCycle).filter(ChitAuctionCycle.chit_fund_id == chit.id).count()

    cycle = ChitAuctionCycle(
        chit_fund_id=chit.id,
        cycle_number=existing_cycles + 1,
        auction_date=auction_date,
        winner_member_id=winner_member_id,
        pot_value=pot_value,
        winning_bid_amount=winning_bid_amount,
        discount_amount=discount_amount,
        commission_amount=commission_amount,
        dividend_per_member=dividend_per_member,
        notes=notes,
    )
    db.add(cycle)
    db.flush()

    for m in members:
        # Dividend recipients pay a discounted installment; the winner (full payout
        # already received) and any already-won members (no longer earning a
        # dividend) pay the full installment.
        is_dividend_recipient = m in dividend_recipients
        amount_due = (
            round(chit.monthly_installment - dividend_per_member, 2)
            if is_dividend_recipient
            else chit.monthly_installment
        )
        db.add(ChitCyclePayment(cycle_id=cycle.id, member_id=m.id, amount_due=amount_due))

    winner.has_won = True
    winner.won_month = cycle.cycle_number
    winner.won_date = auction_date
    winner.bid_amount = winning_bid_amount

    db.commit()
    db.refresh(cycle)
    return cycle


def delete_cycle(db: Session, cycle: ChitAuctionCycle) -> None:
    winner = db.get(ChitMember, cycle.winner_member_id)
    if winner:
        winner.has_won = False
        winner.won_month = None
        winner.won_date = None
        winner.bid_amount = None
    db.delete(cycle)
    db.commit()
