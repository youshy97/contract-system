from datetime import date, datetime

from pydantic import BaseModel


class ExecutionPhaseBase(BaseModel):
    project_id: int
    phase_name: str
    phase_number: int
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    site_engineer_id: int | None = None


class ExecutionPhaseCreate(ExecutionPhaseBase):
    pass


class ExecutionPhaseUpdate(BaseModel):
    phase_name: str | None = None
    description: str | None = None
    status: str | None = None
    progress_percentage: float | None = None
    start_date: date | None = None
    end_date: date | None = None
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    site_engineer_id: int | None = None
    notes: str | None = None


class ExecutionPhaseResponse(ExecutionPhaseBase):
    id: int
    status: str
    progress_percentage: float
    actual_start_date: date | None = None
    actual_end_date: date | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
