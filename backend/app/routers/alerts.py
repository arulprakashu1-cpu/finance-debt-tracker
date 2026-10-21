from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.services.notifications import dispatch_alert

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=list[schemas.AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    return db.query(models.Alert).order_by(models.Alert.due_date).all()


@router.post("", response_model=schemas.AlertOut, status_code=201)
def create_alert(payload: schemas.AlertCreate, db: Session = Depends(get_db)):
    alert = models.Alert(**payload.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.post("/{alert_id}/send", response_model=schemas.AlertOut)
def send_alert(alert_id: int, db: Session = Depends(get_db)):
    alert = db.get(models.Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    delivered = dispatch_alert(alert)
    alert.status = models.AlertStatus.sent if delivered else models.AlertStatus.failed
    alert.sent_at = datetime.utcnow()
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/escalations", response_model=list[schemas.AlertOut])
def escalations(db: Session = Depends(get_db)):
    """Alerts whose due date has passed but which never went out (missed events)."""
    today = date.today()
    return (
        db.query(models.Alert)
        .filter(models.Alert.due_date < today, models.Alert.status != models.AlertStatus.sent)
        .all()
    )
