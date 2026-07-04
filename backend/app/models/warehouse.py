from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class GoodsReceiptNote(Base):
    __tablename__ = "goods_receipt_notes"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    grn_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    po_id: Mapped[int] = mapped_column(ForeignKey("purchase_orders.id"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    received_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    received_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    inspection_status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending, passed, failed, partial
    quantity_received: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    quantity_accepted: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    purchase_order = relationship("PurchaseOrder", back_populates="grns")
    project = relationship("Project")
    received_by = relationship("User")


class Stock(Base):
    __tablename__ = "stock"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    grn_id: Mapped[int] = mapped_column(ForeignKey("goods_receipt_notes.id"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    item_description: Mapped[str] = mapped_column(Text)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    quantity_issued: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    quantity_available: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    grn = relationship("GoodsReceiptNote")
    project = relationship("Project")


class MaterialIssue(Base):
    __tablename__ = "material_issues"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    issue_number: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    stock_id: Mapped[int] = mapped_column(ForeignKey("stock.id"), index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    quantity_issued: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    issued_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    issued_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    purpose: Mapped[str | None] = mapped_column(Text, nullable=True)
    phase_id: Mapped[int | None] = mapped_column(
        ForeignKey("execution_phases.id"), nullable=True
    )
    issue_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    stock = relationship("Stock")
    project = relationship("Project")
    issued_by = relationship("User")
    phase = relationship("ExecutionPhase")
