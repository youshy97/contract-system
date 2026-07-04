from datetime import date, datetime

from pydantic import BaseModel


class SupplierBase(BaseModel):
    name: str
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    country: str | None = None
    supplier_type: str = "local"


class SupplierCreate(SupplierBase):
    pass


class SupplierUpdate(BaseModel):
    name: str | None = None
    contact_person: str | None = None
    email: str | None = None
    phone: str | None = None
    address: str | None = None
    country: str | None = None
    supplier_type: str | None = None
    is_active: bool | None = None


class SupplierResponse(SupplierBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PurchaseRequestBase(BaseModel):
    project_id: int
    description: str | None = None
    purchase_type: str = "local"
    total_estimated: float = 0


class PurchaseRequestCreate(PurchaseRequestBase):
    pass


class PurchaseRequestUpdate(BaseModel):
    description: str | None = None
    status: str | None = None
    total_estimated: float | None = None


class PurchaseRequestResponse(PurchaseRequestBase):
    id: int
    pr_number: str
    status: str
    requested_by_id: int | None = None
    approved_by_id: int | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    pr_id: int
    supplier_id: int
    project_id: int
    total_amount: float = 0
    currency: str = "USD"
    purchase_type: str = "local"
    expected_delivery: date | None = None
    notes: str | None = None


class PurchaseOrderCreate(PurchaseOrderBase):
    pass


class PurchaseOrderUpdate(BaseModel):
    status: str | None = None
    total_amount: float | None = None
    expected_delivery: date | None = None
    notes: str | None = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: int
    po_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ComparisonSheetBase(BaseModel):
    pr_id: int
    supplier_id: int
    item_description: str
    quoted_price: float = 0
    delivery_time: str | None = None
    notes: str | None = None


class ComparisonSheetCreate(ComparisonSheetBase):
    pass


class ComparisonSheetResponse(ComparisonSheetBase):
    id: int
    is_selected: bool
    created_at: datetime

    class Config:
        from_attributes = True
