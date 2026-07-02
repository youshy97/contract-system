from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.execution import ExecutionPhase
from app.models.user import User
from app.schemas.execution import ExecutionPhaseCreate, ExecutionPhaseResponse, ExecutionPhaseUpdate

router = APIRouter(prefix="/execution", tags=["Execution"])


@router.get("/project/{project_id}", response_model=list[ExecutionPhaseResponse])
def list_phases(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(ExecutionPhase)
        .filter(ExecutionPhase.project_id == project_id, not ExecutionPhase.is_deleted)
        .order_by(ExecutionPhase.phase_number)
        .all()
    )


@router.post("/phases", response_model=ExecutionPhaseResponse, status_code=201)
def create_phase(
    data: ExecutionPhaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phase = ExecutionPhase(**data.model_dump())
    db.add(phase)
    db.flush()

    audit = AuditLog(
        entity_type="execution_phase",
        entity_id=phase.id,
        action="create",
        user_id=current_user.id,
        project_id=data.project_id,
    )
    db.add(audit)
    db.commit()
    db.refresh(phase)
    return phase


@router.put("/phases/{phase_id}", response_model=ExecutionPhaseResponse)
def update_phase(
    phase_id: int,
    data: ExecutionPhaseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phase = (
        db.query(ExecutionPhase)
        .filter(ExecutionPhase.id == phase_id, not ExecutionPhase.is_deleted)
        .first()
    )
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(phase, field)
        if old_value != value:
            audit = AuditLog(
                entity_type="execution_phase",
                entity_id=phase.id,
                action="update",
                field_changed=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(value) if value is not None else None,
                user_id=current_user.id,
                project_id=phase.project_id,
            )
            db.add(audit)
        setattr(phase, field, value)

    db.commit()
    db.refresh(phase)
    return phase


@router.delete("/phases/{phase_id}")
def delete_phase(
    phase_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    phase = db.query(ExecutionPhase).filter(ExecutionPhase.id == phase_id).first()
    if not phase:
        raise HTTPException(status_code=404, detail="Phase not found")
    phase.is_deleted = True
    db.commit()
    return {"detail": "Phase deleted (soft)"}
