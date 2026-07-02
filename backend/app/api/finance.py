import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.finance import Invoice, PaymentSchedule
from app.models.user import User
from app.schemas.finance import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    PaymentScheduleCreate,
    PaymentScheduleResponse,
    PaymentScheduleUpdate,
)

router = APIRouter(prefix="/finance", tags=["Finance"])


# --- Invoices ---
@router.get("/invoices", response_model=list[InvoiceResponse])
def list_invoices(
    project_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice).filter(Invoice.is_deleted.is_(False))
    if project_id:
        query = query.filter(Invoice.project_id == project_id)
    if status:
        query = query.filter(Invoice.status == status)
    return query.order_by(Invoice.created_at.desc()).all()


@router.post("/invoices", response_model=InvoiceResponse, status_code=201)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice_number = f"INV-{uuid.uuid4().hex[:8].upper()}"
    invoice = Invoice(invoice_number=invoice_number, **data.model_dump())
    db.add(invoice)
    db.flush()

    audit = AuditLog(
        entity_type="invoice",
        entity_id=invoice.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(invoice, field, value)
    db.commit()
    db.refresh(invoice)
    return invoice


# --- Payment Schedules ---
@router.get("/payment-schedules", response_model=list[PaymentScheduleResponse])
def list_payment_schedules(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PaymentSchedule).filter(PaymentSchedule.is_deleted.is_(False))
    if project_id:
        query = query.filter(PaymentSchedule.project_id == project_id)
    return query.all()


@router.post("/payment-schedules", response_model=PaymentScheduleResponse, status_code=201)
def create_payment_schedule(
    data: PaymentScheduleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = PaymentSchedule(**data.model_dump())
    db.add(schedule)
    db.commit()
    db.refresh(schedule)
    return schedule


@router.put("/payment-schedules/{schedule_id}", response_model=PaymentScheduleResponse)
def update_payment_schedule(
    schedule_id: int,
    data: PaymentScheduleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    schedule = db.query(PaymentSchedule).filter(PaymentSchedule.id == schedule_id).first()
    if not schedule:
        raise HTTPException(status_code=404, detail="Payment schedule not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(schedule, field, value)
    db.commit()
    db.refresh(schedule)
    return schedule
