from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.chit_auction import create_cycle, delete_cycle

router = APIRouter(prefix="/chit-funds", tags=["chit-funds"])


@router.get("", response_model=list[schemas.ChitFundOut])
def list_chit_funds(db: Session = Depends(get_db)):
    return db.query(models.ChitFund).order_by(models.ChitFund.auction_date).all()


@router.post("", response_model=schemas.ChitFundOut, status_code=201)
def create_chit_fund(payload: schemas.ChitFundCreate, db: Session = Depends(get_db)):
    chit = models.ChitFund(**payload.model_dump())
    db.add(chit)
    db.flush()

    # The owner/foreman is, by default, a member who's already taken their share
    # (the "first yelam") — a permanent payer slot, never bids, never shares the
    # dividend. Added automatically so you don't have to set this up by hand.
    if chit.foreman_name.strip():
        db.add(
            models.ChitMember(
                chit_fund_id=chit.id,
                name=chit.foreman_name.strip(),
                participates_in_auction=False,
                has_won=True,
            )
        )

    db.commit()
    db.refresh(chit)
    return chit


@router.get("/{chit_id}", response_model=schemas.ChitFundOut)
def get_chit_fund(chit_id: int, db: Session = Depends(get_db)):
    chit = db.get(models.ChitFund, chit_id)
    if not chit:
        raise HTTPException(404, "Chit fund not found")
    return chit


@router.put("/{chit_id}", response_model=schemas.ChitFundOut)
def update_chit_fund(chit_id: int, payload: schemas.ChitFundCreate, db: Session = Depends(get_db)):
    chit = db.get(models.ChitFund, chit_id)
    if not chit:
        raise HTTPException(404, "Chit fund not found")
    for key, value in payload.model_dump().items():
        setattr(chit, key, value)
    db.commit()
    db.refresh(chit)
    return chit


@router.delete("/{chit_id}", status_code=204)
def delete_chit_fund(chit_id: int, db: Session = Depends(get_db)):
    chit = db.get(models.ChitFund, chit_id)
    if not chit:
        raise HTTPException(404, "Chit fund not found")
    db.delete(chit)
    db.commit()


# ---- Members ----
@router.get("/{chit_id}/members", response_model=list[schemas.ChitMemberOut])
def list_members(chit_id: int, db: Session = Depends(get_db)):
    if not db.get(models.ChitFund, chit_id):
        raise HTTPException(404, "Chit fund not found")
    return (
        db.query(models.ChitMember)
        .filter(models.ChitMember.chit_fund_id == chit_id)
        .order_by(models.ChitMember.id)
        .all()
    )


def _apply_permanent_payer_rule(data: dict) -> dict:
    """A permanent payer slot (the owner/foreman's own share) is, by default,
    considered to have already taken the chit — their 'first yelam' — since
    they never compete in a real auction. Applies to every chit fund.
    """
    if not data.get("participates_in_auction", True):
        data["has_won"] = True
    return data


@router.post("/{chit_id}/members", response_model=schemas.ChitMemberOut, status_code=201)
def add_member(chit_id: int, payload: schemas.ChitMemberCreate, db: Session = Depends(get_db)):
    if not db.get(models.ChitFund, chit_id):
        raise HTTPException(404, "Chit fund not found")
    data = _apply_permanent_payer_rule(payload.model_dump())
    member = models.ChitMember(chit_fund_id=chit_id, **data)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/members/{member_id}", response_model=schemas.ChitMemberOut)
def update_member(member_id: int, payload: schemas.ChitMemberCreate, db: Session = Depends(get_db)):
    member = db.get(models.ChitMember, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    data = _apply_permanent_payer_rule(payload.model_dump())
    for key, value in data.items():
        setattr(member, key, value)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/members/{member_id}", status_code=204)
def delete_member(member_id: int, db: Session = Depends(get_db)):
    member = db.get(models.ChitMember, member_id)
    if not member:
        raise HTTPException(404, "Member not found")
    db.delete(member)
    db.commit()


# ---- Auction Cycles ----
@router.get("/{chit_id}/cycles", response_model=list[schemas.ChitAuctionCycleOut])
def list_cycles(chit_id: int, db: Session = Depends(get_db)):
    if not db.get(models.ChitFund, chit_id):
        raise HTTPException(404, "Chit fund not found")
    return (
        db.query(models.ChitAuctionCycle)
        .filter(models.ChitAuctionCycle.chit_fund_id == chit_id)
        .order_by(models.ChitAuctionCycle.cycle_number)
        .all()
    )


@router.post("/{chit_id}/cycles", response_model=schemas.ChitAuctionCycleOut, status_code=201)
def record_auction(chit_id: int, payload: schemas.ChitAuctionCycleCreate, db: Session = Depends(get_db)):
    chit = db.get(models.ChitFund, chit_id)
    if not chit:
        raise HTTPException(404, "Chit fund not found")
    return create_cycle(
        db,
        chit,
        auction_date=payload.auction_date,
        winner_member_id=payload.winner_member_id,
        winning_bid_amount=payload.winning_bid_amount,
        notes=payload.notes,
    )


@router.delete("/cycles/{cycle_id}", status_code=204)
def remove_cycle(cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.get(models.ChitAuctionCycle, cycle_id)
    if not cycle:
        raise HTTPException(404, "Auction cycle not found")
    latest = (
        db.query(models.ChitAuctionCycle)
        .filter(models.ChitAuctionCycle.chit_fund_id == cycle.chit_fund_id)
        .order_by(models.ChitAuctionCycle.cycle_number.desc())
        .first()
    )
    if latest and latest.id != cycle.id:
        raise HTTPException(400, "Only the most recent auction cycle can be removed")
    delete_cycle(db, cycle)


@router.put("/cycles/payments/{payment_id}", response_model=schemas.ChitCyclePaymentOut)
def update_cycle_payment(
    payment_id: int, payload: schemas.ChitCyclePaymentUpdate, db: Session = Depends(get_db)
):
    payment = db.get(models.ChitCyclePayment, payment_id)
    if not payment:
        raise HTTPException(404, "Payment not found")
    payment.is_paid = payload.is_paid
    payment.paid_date = payload.paid_date if payload.is_paid else None
    if payload.is_paid and not payment.paid_date:
        payment.paid_date = date.today()
    db.commit()
    db.refresh(payment)
    return payment
