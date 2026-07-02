from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.boq import BOQ, BOQItem, BOQSection
from app.models.user import User
from app.schemas.boq import (
    BOQCreate,
    BOQItemCreate,
    BOQItemUpdate,
    BOQListResponse,
    BOQNewVersion,
    BOQResponse,
    BOQSectionCreate,
)

router = APIRouter(prefix="/boq", tags=["BOQ"])


@router.get("/project/{project_id}", response_model=list[BOQListResponse])
def list_boqs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(BOQ)
        .filter(BOQ.project_id == project_id, BOQ.is_deleted.is_(False))
        .order_by(BOQ.version.desc())
        .all()
    )


@router.post("/", response_model=BOQResponse, status_code=201)
def create_boq(
    data: BOQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(BOQ)
        .filter(BOQ.project_id == data.project_id, BOQ.is_deleted.is_(False))
        .count()
    )

    boq = BOQ(
        project_id=data.project_id,
        version=existing + 1,
        exchange_rate=data.exchange_rate,
        created_by_id=current_user.id,
    )
    db.add(boq)
    db.flush()

    total_cost = 0
    total_selling = 0

    for section_data in data.sections:
        section = BOQSection(
            boq_id=boq.id,
            section_name=section_data.section_name,
            sort_order=section_data.sort_order,
        )
        db.add(section)
        db.flush()

        for item_data in section_data.items:
            item = BOQItem(
                section_id=section.id,
                **item_data.model_dump(),
            )
            total_cost += item.quantity * item.unit_cost
            total_selling += item.quantity * item.selling_price
            db.add(item)

    boq.total_cost = total_cost
    boq.total_selling = total_selling
    boq.profit = total_selling - total_cost

    audit = AuditLog(
        entity_type="boq",
        entity_id=boq.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(boq)
    return boq


@router.get("/{boq_id}", response_model=BOQResponse)
def get_boq(
    boq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id, BOQ.is_deleted.is_(False)).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    return boq


@router.post("/{boq_id}/new-version", response_model=BOQResponse, status_code=201)
def create_new_version(
    boq_id: int,
    data: BOQNewVersion,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new version of an existing BOQ (copies all sections and items)."""
    original = db.query(BOQ).filter(BOQ.id == boq_id, BOQ.is_deleted.is_(False)).first()
    if not original:
        raise HTTPException(status_code=404, detail="BOQ not found")

    version_count = (
        db.query(BOQ)
        .filter(BOQ.project_id == original.project_id, BOQ.is_deleted.is_(False))
        .count()
    )

    new_boq = BOQ(
        project_id=original.project_id,
        version=version_count + 1,
        exchange_rate=original.exchange_rate,
        change_type=data.change_type,
        change_reason=data.change_reason,
        total_cost=original.total_cost,
        total_selling=original.total_selling,
        profit=original.profit,
        created_by_id=current_user.id,
    )
    db.add(new_boq)
    db.flush()

    for section in original.sections:
        if section.is_deleted:
            continue
        new_section = BOQSection(
            boq_id=new_boq.id,
            section_name=section.section_name,
            sort_order=section.sort_order,
        )
        db.add(new_section)
        db.flush()

        for item in section.items:
            if item.is_deleted:
                continue
            new_item = BOQItem(
                section_id=new_section.id,
                description=item.description,
                quantity=item.quantity,
                unit=item.unit,
                unit_cost=item.unit_cost,
                selling_price=item.selling_price,
                profit_percentage=item.profit_percentage,
                supplier_id=item.supplier_id,
                status=item.status,
            )
            db.add(new_item)

    audit = AuditLog(
        entity_type="boq",
        entity_id=new_boq.id,
        action="create",
        new_value=f"Version {new_boq.version} from V{original.version}",
        reason=data.change_reason,
        user_id=current_user.id,
        project_id=original.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(new_boq)
    return new_boq


@router.post("/{boq_id}/sections", response_model=BOQResponse)
def add_section(
    boq_id: int,
    data: BOQSectionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id, BOQ.is_deleted.is_(False)).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    if boq.status not in ("draft", "repricing"):
        raise HTTPException(status_code=400, detail="BOQ is not editable")

    section = BOQSection(
        boq_id=boq.id,
        section_name=data.section_name,
        sort_order=data.sort_order,
    )
    db.add(section)
    db.flush()

    for item_data in data.items:
        item = BOQItem(section_id=section.id, **item_data.model_dump())
        db.add(item)

    _recalculate_boq_totals(boq, db)
    db.commit()
    db.refresh(boq)
    return boq


@router.post("/{boq_id}/sections/{section_id}/items", response_model=BOQResponse)
def add_item(
    boq_id: int,
    section_id: int,
    data: BOQItemCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id, BOQ.is_deleted.is_(False)).first()
    if not boq:
        raise HTTPException(status_code=404, detail="BOQ not found")
    if boq.status not in ("draft", "repricing"):
        raise HTTPException(status_code=400, detail="BOQ is not editable")

    section = db.query(BOQSection).filter(BOQSection.id == section_id).first()
    if not section or section.boq_id != boq_id:
        raise HTTPException(status_code=404, detail="Section not found")

    item = BOQItem(section_id=section_id, **data.model_dump())
    db.add(item)
    _recalculate_boq_totals(boq, db)
    db.commit()
    db.refresh(boq)
    return boq


@router.put("/items/{item_id}", response_model=BOQResponse)
def update_item(
    item_id: int,
    data: BOQItemUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    item = db.query(BOQItem).filter(BOQItem.id == item_id, BOQItem.is_deleted.is_(False)).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    section = db.query(BOQSection).filter(BOQSection.id == item.section_id).first()
    boq = db.query(BOQ).filter(BOQ.id == section.boq_id).first()

    if boq.status not in ("draft", "repricing"):
        raise HTTPException(status_code=400, detail="BOQ is not editable")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(item, field)
        if old_value != value:
            audit = AuditLog(
                entity_type="boq_item",
                entity_id=item.id,
                action="update",
                field_changed=field,
                old_value=str(old_value),
                new_value=str(value),
                user_id=current_user.id,
                project_id=boq.project_id,
            )
            db.add(audit)
        setattr(item, field, value)

    _recalculate_boq_totals(boq, db)
    db.commit()
    db.refresh(boq)
    return boq


@router.post("/{boq_id}/submit-review")
def submit_for_review(
    boq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq or boq.status != "draft":
        raise HTTPException(status_code=400, detail="BOQ must be in draft status")
    boq.status = "review"
    audit = AuditLog(
        entity_type="boq",
        entity_id=boq.id,
        action="update",
        field_changed="status",
        old_value="draft",
        new_value="review",
        user_id=current_user.id,
        project_id=boq.project_id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "BOQ submitted for review"}


@router.post("/{boq_id}/approve")
def approve_boq(
    boq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["management", "department_manager"])
    ),
):
    """Only management can approve a BOQ for sending to customer."""
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq or boq.status != "review":
        raise HTTPException(status_code=400, detail="BOQ must be in review status")

    from datetime import datetime, timezone

    boq.status = "approved"
    boq.approved_by_id = current_user.id
    boq.approved_at = datetime.now(timezone.utc)

    audit = AuditLog(
        entity_type="boq",
        entity_id=boq.id,
        action="approve",
        field_changed="status",
        old_value="review",
        new_value="approved",
        user_id=current_user.id,
        project_id=boq.project_id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "BOQ approved"}


@router.post("/{boq_id}/reject")
def reject_boq(
    boq_id: int,
    reason: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_role(["management", "department_manager"])
    ),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq or boq.status != "review":
        raise HTTPException(status_code=400, detail="BOQ must be in review status")
    boq.status = "rejected"
    audit = AuditLog(
        entity_type="boq",
        entity_id=boq.id,
        action="reject",
        field_changed="status",
        old_value="review",
        new_value="rejected",
        reason=reason,
        user_id=current_user.id,
        project_id=boq.project_id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "BOQ rejected"}


@router.post("/{boq_id}/send-to-customer")
def send_to_customer(
    boq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    boq = db.query(BOQ).filter(BOQ.id == boq_id).first()
    if not boq or boq.status != "approved":
        raise HTTPException(
            status_code=400,
            detail="BOQ must be approved by management before sending to customer",
        )
    boq.status = "sent"
    audit = AuditLog(
        entity_type="boq",
        entity_id=boq.id,
        action="update",
        field_changed="status",
        old_value="approved",
        new_value="sent",
        user_id=current_user.id,
        project_id=boq.project_id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "BOQ sent to customer"}


def _recalculate_boq_totals(boq: BOQ, db: Session):
    total_cost = 0
    total_selling = 0
    for section in boq.sections:
        if section.is_deleted:
            continue
        for item in section.items:
            if item.is_deleted:
                continue
            total_cost += float(item.quantity) * float(item.unit_cost)
            total_selling += float(item.quantity) * float(item.selling_price)
    boq.total_cost = total_cost
    boq.total_selling = total_selling
    boq.profit = total_selling - total_cost
