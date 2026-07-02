from datetime import date, datetime

from pydantic import BaseModel


class InvoiceBase(BaseModel):
    project_id: int
    amount: float = 0
    percentage: float = 0
    issue_date: date | None = None
    due_date: date | None = None
    description: str | None = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    amount: float | None = None
    percentage: float | None = None
    status: str | None = None
    issue_date: date | None = None
    due_date: date | None = None
    paid_date: date | None = None
    description: str | None = None


class InvoiceResponse(InvoiceBase):
    id: int
    invoice_number: str
    status: str
    paid_date: date | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentScheduleBase(BaseModel):
    project_id: int
    milestone_name: str
    percentage: float = 0
    amount: float = 0
    due_date: date | None = None


class PaymentScheduleCreate(PaymentScheduleBase):
    pass


class PaymentScheduleUpdate(BaseModel):
    milestone_name: str | None = None
    percentage: float | None = None
    amount: float | None = None
    status: str | None = None
    due_date: date | None = None
    invoice_id: int | None = None


class PaymentScheduleResponse(PaymentScheduleBase):
    id: int
    status: str
    invoice_id: int | None = None
    created_at: datetime

    class Config:
        from_attributes = True
