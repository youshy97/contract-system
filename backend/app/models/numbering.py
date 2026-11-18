from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Company(Base):
    __tablename__ = "numbering_companies"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    code: Mapped[str] = mapped_column(String(12), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)


class NumberSequence(Base):
    __tablename__ = "number_sequences"
    __table_args__ = (
        UniqueConstraint("company_id", "document_type", "year", name="uq_number_sequence_scope"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("numbering_companies.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(8))
    year: Mapped[int] = mapped_column(Integer)
    last_number: Mapped[int] = mapped_column(Integer, default=0)


class GeneratedNumber(Base):
    __tablename__ = "generated_numbers"
    __table_args__ = (
        UniqueConstraint("company_id", "document_type", "year", "serial", name="uq_generated_number"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(ForeignKey("numbering_companies.id"), index=True)
    document_type: Mapped[str] = mapped_column(String(8), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    serial: Mapped[int] = mapped_column(Integer)
    number: Mapped[str] = mapped_column(String(40), unique=True, index=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow, index=True)
