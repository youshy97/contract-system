from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BOQ(Base):
    __tablename__ = "boqs"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_id: Mapped[int] = mapped_column(ForeignKey("projects.id"), index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str] = mapped_column(
        String(50), default="draft"
    )  # draft, review, sent, approved, rejected, repricing
    total_cost: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    total_selling: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    profit: Mapped[float] = mapped_column(Numeric(15, 2), default=0)
    exchange_rate: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    change_type: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )  # major, minor
    change_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project = relationship("Project", back_populates="boqs")
    sections = relationship("BOQSection", back_populates="boq", cascade="all, delete-orphan")
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    created_by = relationship("User", foreign_keys=[created_by_id])


class BOQSection(Base):
    __tablename__ = "boq_sections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    boq_id: Mapped[int] = mapped_column(ForeignKey("boqs.id"), index=True)
    section_name: Mapped[str] = mapped_column(
        String(100)
    )  # Materials, Civil Works, Logistics, Installation
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    boq = relationship("BOQ", back_populates="sections")
    items = relationship("BOQItem", back_populates="section", cascade="all, delete-orphan")


class BOQItem(Base):
    __tablename__ = "boq_items"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    section_id: Mapped[int] = mapped_column(ForeignKey("boq_sections.id"), index=True)
    description: Mapped[str] = mapped_column(Text)
    quantity: Mapped[float] = mapped_column(Numeric(12, 3), default=0)
    unit: Mapped[str | None] = mapped_column(String(50), nullable=True)
    unit_cost: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    selling_price: Mapped[float] = mapped_column(Numeric(12, 2), default=0)
    profit_percentage: Mapped[float] = mapped_column(Numeric(6, 2), default=0)
    supplier_id: Mapped[int | None] = mapped_column(ForeignKey("suppliers.id"), nullable=True)
    pr_id: Mapped[int | None] = mapped_column(
        ForeignKey("purchase_requests.id"), nullable=True
    )
    po_id: Mapped[int | None] = mapped_column(ForeignKey("purchase_orders.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="pending")
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    section = relationship("BOQSection", back_populates="items")
    supplier = relationship("Supplier")
    purchase_request = relationship("PurchaseRequest")
    purchase_order = relationship("PurchaseOrder")
