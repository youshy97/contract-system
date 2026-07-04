from datetime import datetime

from pydantic import BaseModel


class BOQItemBase(BaseModel):
    description: str
    quantity: float = 0
    unit: str | None = None
    unit_cost: float = 0
    selling_price: float = 0
    profit_percentage: float = 0
    supplier_id: int | None = None
    status: str = "pending"


class BOQItemCreate(BOQItemBase):
    pass


class BOQItemUpdate(BaseModel):
    description: str | None = None
    quantity: float | None = None
    unit: str | None = None
    unit_cost: float | None = None
    selling_price: float | None = None
    profit_percentage: float | None = None
    supplier_id: int | None = None
    status: str | None = None


class BOQItemResponse(BOQItemBase):
    id: int
    section_id: int
    pr_id: int | None = None
    po_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class BOQSectionBase(BaseModel):
    section_name: str
    sort_order: int = 0


class BOQSectionCreate(BOQSectionBase):
    items: list[BOQItemCreate] = []


class BOQSectionResponse(BOQSectionBase):
    id: int
    boq_id: int
    items: list[BOQItemResponse] = []
    created_at: datetime

    class Config:
        from_attributes = True


class BOQBase(BaseModel):
    exchange_rate: float | None = None


class BOQCreate(BOQBase):
    project_id: int
    sections: list[BOQSectionCreate] = []


class BOQNewVersion(BaseModel):
    change_type: str = "minor"  # major, minor
    change_reason: str | None = None


class BOQResponse(BOQBase):
    id: int
    project_id: int
    version: int
    status: str
    total_cost: float
    total_selling: float
    profit: float
    change_type: str | None = None
    change_reason: str | None = None
    sections: list[BOQSectionResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class BOQListResponse(BaseModel):
    id: int
    project_id: int
    version: int
    status: str
    total_cost: float
    total_selling: float
    profit: float
    created_at: datetime

    class Config:
        from_attributes = True
