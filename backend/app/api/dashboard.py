from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.boq import BOQ
from app.models.execution import ExecutionPhase
from app.models.finance import Invoice
from app.models.procurement import PurchaseOrder, PurchaseRequest
from app.models.project import Project
from app.models.user import User
from app.models.warehouse import Stock

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Role-based dashboard data."""
    total_projects = db.query(Project).filter(Project.is_deleted.is_(False)).count()
    active_projects = (
        db.query(Project)
        .filter(Project.is_deleted.is_(False), Project.status.notin_(["closure", "intake"]))
        .count()
    )

    projects_by_status = (
        db.query(Project.status, func.count(Project.id))
        .filter(Project.is_deleted.is_(False))
        .group_by(Project.status)
        .all()
    )

    total_revenue = (
        db.query(func.sum(Invoice.amount))
        .filter(Invoice.status == "paid", Invoice.is_deleted.is_(False))
        .scalar()
        or 0
    )

    pending_invoices = (
        db.query(func.sum(Invoice.amount))
        .filter(Invoice.status == "issued", Invoice.is_deleted.is_(False))
        .scalar()
        or 0
    )

    total_po_value = (
        db.query(func.sum(PurchaseOrder.total_amount))
        .filter(PurchaseOrder.is_deleted.is_(False))
        .scalar()
        or 0
    )

    pending_prs = (
        db.query(PurchaseRequest)
        .filter(PurchaseRequest.status == "submitted", PurchaseRequest.is_deleted.is_(False))
        .count()
    )

    open_pos = (
        db.query(PurchaseOrder)
        .filter(
            PurchaseOrder.status.in_(["issued", "partially_received"]),
            PurchaseOrder.is_deleted.is_(False),
        )
        .count()
    )

    avg_progress = (
        db.query(func.avg(ExecutionPhase.progress_percentage))
        .filter(ExecutionPhase.is_deleted.is_(False), ExecutionPhase.status == "in_progress")
        .scalar()
        or 0
    )

    stock_items = db.query(Stock).filter(Stock.quantity_available > 0).count()

    boqs_pending_approval = (
        db.query(BOQ).filter(BOQ.status == "review", BOQ.is_deleted.is_(False)).count()
    )

    return {
        "projects": {
            "total": total_projects,
            "active": active_projects,
            "by_status": {status: count for status, count in projects_by_status},
        },
        "finance": {
            "total_revenue": float(total_revenue),
            "pending_invoices": float(pending_invoices),
            "total_po_value": float(total_po_value),
        },
        "procurement": {
            "pending_prs": pending_prs,
            "open_pos": open_pos,
        },
        "execution": {
            "avg_progress": float(avg_progress),
        },
        "warehouse": {
            "stock_items_available": stock_items,
        },
        "approvals": {
            "boqs_pending": boqs_pending_approval,
        },
    }


@router.get("/project/{project_id}/summary")
def get_project_summary(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Per-project dashboard."""
    project = (
        db.query(Project).filter(Project.id == project_id, Project.is_deleted.is_(False)).first()
    )
    if not project:
        return {"error": "Project not found"}

    latest_boq = (
        db.query(BOQ)
        .filter(BOQ.project_id == project_id, BOQ.is_deleted.is_(False))
        .order_by(BOQ.version.desc())
        .first()
    )

    phases = (
        db.query(ExecutionPhase)
        .filter(ExecutionPhase.project_id == project_id, ExecutionPhase.is_deleted.is_(False))
        .all()
    )

    total_invoiced = (
        db.query(func.sum(Invoice.amount))
        .filter(Invoice.project_id == project_id, Invoice.is_deleted.is_(False))
        .scalar()
        or 0
    )

    total_paid = (
        db.query(func.sum(Invoice.amount))
        .filter(
            Invoice.project_id == project_id,
            Invoice.status == "paid",
            Invoice.is_deleted.is_(False),
        )
        .scalar()
        or 0
    )

    pos = (
        db.query(PurchaseOrder)
        .filter(PurchaseOrder.project_id == project_id, PurchaseOrder.is_deleted.is_(False))
        .all()
    )

    return {
        "project": {
            "id": project.id,
            "code": project.project_code,
            "name": project.project_name,
            "status": project.status,
            "customer": project.customer,
        },
        "boq": {
            "latest_version": latest_boq.version if latest_boq else 0,
            "status": latest_boq.status if latest_boq else None,
            "total_cost": float(latest_boq.total_cost) if latest_boq else 0,
            "total_selling": float(latest_boq.total_selling) if latest_boq else 0,
            "profit": float(latest_boq.profit) if latest_boq else 0,
        },
        "execution": {
            "phases": len(phases),
            "completed": len([p for p in phases if p.status == "completed"]),
            "avg_progress": (
                sum(float(p.progress_percentage) for p in phases) / len(phases) if phases else 0
            ),
        },
        "finance": {
            "total_invoiced": float(total_invoiced),
            "total_paid": float(total_paid),
            "outstanding": float(total_invoiced) - float(total_paid),
        },
        "procurement": {
            "total_pos": len(pos),
            "total_po_value": sum(float(po.total_amount) for po in pos),
        },
    }
