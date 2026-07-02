import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.procurement import ComparisonSheet, PurchaseOrder, PurchaseRequest, Supplier
from app.models.user import User
from app.schemas.procurement import (
    ComparisonSheetCreate,
    ComparisonSheetResponse,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
    PurchaseRequestCreate,
    PurchaseRequestResponse,
    PurchaseRequestUpdate,
    SupplierCreate,
    SupplierResponse,
    SupplierUpdate,
)

router = APIRouter(prefix="/procurement", tags=["Procurement"])


# --- Suppliers ---
@router.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(
    supplier_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Supplier).filter(Supplier.is_deleted.is_(False))
    if supplier_type:
        query = query.filter(Supplier.supplier_type == supplier_type)
    return query.all()


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
def create_supplier(
    data: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = Supplier(**data.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.put("/suppliers/{supplier_id}", response_model=SupplierResponse)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)
    db.commit()
    db.refresh(supplier)
    return supplier


# --- Purchase Requests ---
@router.get("/pr", response_model=list[PurchaseRequestResponse])
def list_purchase_requests(
    project_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PurchaseRequest).filter(PurchaseRequest.is_deleted.is_(False))
    if project_id:
        query = query.filter(PurchaseRequest.project_id == project_id)
    if status:
        query = query.filter(PurchaseRequest.status == status)
    return query.order_by(PurchaseRequest.created_at.desc()).all()


@router.post("/pr", response_model=PurchaseRequestResponse, status_code=201)
def create_purchase_request(
    data: PurchaseRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pr_number = f"PR-{uuid.uuid4().hex[:8].upper()}"
    pr = PurchaseRequest(
        pr_number=pr_number,
        requested_by_id=current_user.id,
        **data.model_dump(),
    )
    db.add(pr)
    db.flush()

    audit = AuditLog(
        entity_type="purchase_request",
        entity_id=pr.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(pr)
    return pr


@router.put("/pr/{pr_id}", response_model=PurchaseRequestResponse)
def update_purchase_request(
    pr_id: int,
    data: PurchaseRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="PR not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(pr, field, value)
    db.commit()
    db.refresh(pr)
    return pr


@router.post("/pr/{pr_id}/approve")
def approve_pr(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    pr = db.query(PurchaseRequest).filter(PurchaseRequest.id == pr_id).first()
    if not pr or pr.status != "submitted":
        raise HTTPException(status_code=400, detail="PR must be in submitted status")
    pr.status = "approved"
    pr.approved_by_id = current_user.id
    audit = AuditLog(
        entity_type="purchase_request",
        entity_id=pr.id,
        action="approve",
        user_id=current_user.id,
        project_id=pr.project_id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "Purchase request approved"}


# --- Purchase Orders ---
@router.get("/po", response_model=list[PurchaseOrderResponse])
def list_purchase_orders(
    project_id: int | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PurchaseOrder).filter(PurchaseOrder.is_deleted.is_(False))
    if project_id:
        query = query.filter(PurchaseOrder.project_id == project_id)
    if status:
        query = query.filter(PurchaseOrder.status == status)
    return query.order_by(PurchaseOrder.created_at.desc()).all()


@router.post("/po", response_model=PurchaseOrderResponse, status_code=201)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po_number = f"PO-{uuid.uuid4().hex[:8].upper()}"
    po = PurchaseOrder(po_number=po_number, **data.model_dump())
    db.add(po)
    db.flush()

    audit = AuditLog(
        entity_type="purchase_order",
        entity_id=po.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(po)
    return po


@router.put("/po/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    po_id: int,
    data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="PO not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(po, field, value)
    db.commit()
    db.refresh(po)
    return po


# --- Comparison Sheets ---
@router.get("/comparison/{pr_id}", response_model=list[ComparisonSheetResponse])
def list_comparisons(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return db.query(ComparisonSheet).filter(ComparisonSheet.pr_id == pr_id).all()


@router.post("/comparison", response_model=ComparisonSheetResponse, status_code=201)
def create_comparison(
    data: ComparisonSheetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    comparison = ComparisonSheet(**data.model_dump())
    db.add(comparison)
    db.commit()
    db.refresh(comparison)
    return comparison
