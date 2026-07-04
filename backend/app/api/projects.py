from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.audit import AuditLog
from app.models.project import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectListResponse, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("/", response_model=list[ProjectListResponse])
def list_projects(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Project).filter(Project.is_deleted.is_(False))
    if status:
        query = query.filter(Project.status == status)
    return query.order_by(Project.created_at.desc()).offset(skip).limit(limit).all()


@router.post("/", response_model=ProjectResponse, status_code=201)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(Project).filter(Project.project_code == data.project_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Project code already exists")

    project = Project(**data.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)

    audit = AuditLog(
        entity_type="project",
        entity_id=project.id,
        action="create",
        user_id=current_user.id,
        project_id=project.id,
    )
    db.add(audit)
    db.commit()
    return project


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_deleted.is_(False))
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.is_deleted.is_(False))
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        old_value = getattr(project, field)
        if old_value != value:
            audit = AuditLog(
                entity_type="project",
                entity_id=project.id,
                action="update",
                field_changed=field,
                old_value=str(old_value) if old_value is not None else None,
                new_value=str(value) if value is not None else None,
                user_id=current_user.id,
                project_id=project.id,
            )
            db.add(audit)
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.is_deleted = True
    audit = AuditLog(
        entity_type="project",
        entity_id=project.id,
        action="delete",
        user_id=current_user.id,
        project_id=project.id,
    )
    db.add(audit)
    db.commit()
    return {"detail": "Project deleted (soft)"}
