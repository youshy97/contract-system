from datetime import datetime

from pydantic import BaseModel


class GRNBase(BaseModel):
    po_id: int
    project_id: int
    quantity_received: float = 0
    quantity_accepted: float = 0
    notes: str | None = None


class GRNCreate(GRNBase):
    pass


class GRNUpdate(BaseModel):
    inspection_status: str | None = None
    quantity_accepted: float | None = None
    notes: str | None = None


class GRNResponse(GRNBase):
    id: int
    grn_number: str
    inspection_status: str
    received_by_id: int | None = None
    received_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class StockResponse(BaseModel):
    id: int
    grn_id: int
    project_id: int
    item_description: str
    quantity: float
    quantity_issued: float
    quantity_available: float
    unit: str | None = None
    location: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class MaterialIssueBase(BaseModel):
    stock_id: int
    project_id: int
    quantity_issued: float
    issued_to: str | None = None
    purpose: str | None = None
    phase_id: int | None = None


class MaterialIssueCreate(MaterialIssueBase):
    pass


class MaterialIssueResponse(MaterialIssueBase):
    id: int
    issue_number: str
    issued_by_id: int | None = None
    issue_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True
