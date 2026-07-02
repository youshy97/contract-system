import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.user import User
from app.models.warehouse import GoodsReceiptNote, MaterialIssue, Stock
from app.schemas.warehouse import (
    GRNCreate,
    GRNResponse,
    GRNUpdate,
    MaterialIssueCreate,
    MaterialIssueResponse,
    StockResponse,
)

router = APIRouter(prefix="/warehouse", tags=["Warehouse"])


# --- GRN ---
@router.get("/grn", response_model=list[GRNResponse])
def list_grns(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.is_deleted.is_(False))
    if project_id:
        query = query.filter(GoodsReceiptNote.project_id == project_id)
    return query.order_by(GoodsReceiptNote.created_at.desc()).all()


@router.post("/grn", response_model=GRNResponse, status_code=201)
def create_grn(
    data: GRNCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grn_number = f"GRN-{uuid.uuid4().hex[:8].upper()}"
    grn = GoodsReceiptNote(
        grn_number=grn_number,
        received_by_id=current_user.id,
        **data.model_dump(),
    )
    db.add(grn)
    db.flush()

    audit = AuditLog(
        entity_type="grn",
        entity_id=grn.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(grn)
    return grn


@router.put("/grn/{grn_id}", response_model=GRNResponse)
def update_grn(
    grn_id: int,
    data: GRNUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    grn = db.query(GoodsReceiptNote).filter(GoodsReceiptNote.id == grn_id).first()
    if not grn:
        raise HTTPException(status_code=404, detail="GRN not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(grn, field, value)

    if grn.inspection_status == "passed" and grn.quantity_accepted > 0:
        existing_stock = (
            db.query(Stock)
            .filter(Stock.grn_id == grn.id)
            .first()
        )
        if not existing_stock:
            stock = Stock(
                grn_id=grn.id,
                project_id=grn.project_id,
                item_description=f"Items from GRN {grn.grn_number}",
                quantity=float(grn.quantity_accepted),
                quantity_available=float(grn.quantity_accepted),
                quantity_issued=0,
            )
            db.add(stock)

    db.commit()
    db.refresh(grn)
    return grn


# --- Stock ---
@router.get("/stock", response_model=list[StockResponse])
def list_stock(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Stock)
    if project_id:
        query = query.filter(Stock.project_id == project_id)
    return query.all()


# --- Material Issues ---
@router.get("/issues", response_model=list[MaterialIssueResponse])
def list_material_issues(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(MaterialIssue)
    if project_id:
        query = query.filter(MaterialIssue.project_id == project_id)
    return query.order_by(MaterialIssue.created_at.desc()).all()


@router.post("/issues", response_model=MaterialIssueResponse, status_code=201)
def issue_material(
    data: MaterialIssueCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stock = db.query(Stock).filter(Stock.id == data.stock_id).first()
    if not stock:
        raise HTTPException(status_code=404, detail="Stock item not found")
    if float(stock.quantity_available) < data.quantity_issued:
        raise HTTPException(status_code=400, detail="Insufficient stock available")

    issue_number = f"ISS-{uuid.uuid4().hex[:8].upper()}"
    issue = MaterialIssue(
        issue_number=issue_number,
        issued_by_id=current_user.id,
        **data.model_dump(),
    )
    db.add(issue)

    stock.quantity_issued = float(stock.quantity_issued) + data.quantity_issued
    stock.quantity_available = float(stock.quantity) - float(stock.quantity_issued)

    audit = AuditLog(
        entity_type="material_issue",
        entity_id=0,
        action="create",
        new_value=f"Issued {data.quantity_issued} from stock {stock.id}",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(issue)
    return issue
