from datetime import date, datetime

from pydantic import BaseModel


class ProjectBase(BaseModel):
    project_code: str
    project_name: str
    customer: str
    beneficiary: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    received_date: date | None = None
    description: str | None = None
    project_manager_id: int | None = None
    project_controller_id: int | None = None
    exchange_rate: float | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    project_name: str | None = None
    customer: str | None = None
    beneficiary: str | None = None
    contact_name: str | None = None
    contact_email: str | None = None
    contact_phone: str | None = None
    received_date: date | None = None
    description: str | None = None
    status: str | None = None
    project_manager_id: int | None = None
    project_controller_id: int | None = None
    exchange_rate: float | None = None


class ProjectResponse(ProjectBase):
    id: int
    status: str
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProjectListResponse(BaseModel):
    id: int
    project_code: str
    project_name: str
    customer: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
