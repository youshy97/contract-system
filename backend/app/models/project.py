from datetime import datetime, timezone

from sqlalchemy import Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    project_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    project_name: Mapped[str] = mapped_column(String(255))
    customer: Mapped[str] = mapped_column(String(255))
    beneficiary: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    received_date: Mapped[datetime | None] = mapped_column(Date, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="intake"
    )  # intake, requirements, boq_preparation, internal_review, management_approval,
    # proposal_sent, customer_response, repricing, procurement, execution, invoicing, closure
    project_manager_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    project_controller_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )
    exchange_rate: Mapped[float | None] = mapped_column(Numeric(12, 4), nullable=True)
    is_deleted: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project_manager = relationship("User", foreign_keys=[project_manager_id])
    project_controller = relationship("User", foreign_keys=[project_controller_id])
    boqs = relationship("BOQ", back_populates="project")
    execution_phases = relationship("ExecutionPhase", back_populates="project")
    invoices = relationship("Invoice", back_populates="project")
    payment_schedules = relationship("PaymentSchedule", back_populates="project")
