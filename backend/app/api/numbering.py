from datetime import datetime
import re

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.numbering import Company, GeneratedNumber, NumberSequence
from app.models.user import User
from app.schemas.numbering import (
    CompanyCreate,
    CompanyResponse,
    GenerateNumberRequest,
    GeneratedNumberResponse,
)

router = APIRouter(prefix="/numbering", tags=["Contract and invoice numbering"])


@router.get("/companies", response_model=list[CompanyResponse])
def list_companies(
    db: Session = Depends(get_db), _user: User = Depends(get_current_user)
):
    return db.query(Company).filter(Company.is_active.is_(True)).order_by(Company.name).all()


@router.post("/companies", response_model=CompanyResponse, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    name = payload.name.strip()
    code = payload.code.strip().upper()
    if db.query(Company).filter((Company.name.ilike(name)) | (Company.code == code)).first():
        raise HTTPException(status_code=409, detail="اسم الشركة أو رمزها مستخدم مسبقاً")
    company = Company(name=name, code=code)
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.post("/generate", response_model=GeneratedNumberResponse, status_code=status.HTTP_201_CREATED)
def generate_number(
    payload: GenerateNumberRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    company = db.query(Company).filter(
        Company.id == payload.company_id, Company.is_active.is_(True)
    ).first()
    if company is None:
        raise HTTPException(status_code=404, detail="الشركة غير موجودة أو غير مفعّلة")

    year = datetime.now().year
    # PostgreSQL's atomic UPSERT serializes simultaneous requests for the same
    # company/document/year while keeping other number streams independent.
    statement = (
        insert(NumberSequence)
        .values(company_id=company.id, document_type=payload.document_type, year=year, last_number=1)
        .on_conflict_do_update(
            constraint="uq_number_sequence_scope",
            set_={"last_number": NumberSequence.last_number + 1},
        )
        .returning(NumberSequence.last_number)
    )
    serial = db.execute(statement).scalar_one()
    number = f"{company.code}-{payload.document_type}-{year}-{serial:04d}"
    record = GeneratedNumber(
        company_id=company.id,
        document_type=payload.document_type,
        year=year,
        serial=serial,
        number=number,
        created_by=current_user.id,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return {
        "id": record.id,
        "company_id": company.id,
        "company_name": company.name,
        "company_code": company.code,
        "document_type": record.document_type,
        "year": record.year,
        "serial": record.serial,
        "number": record.number,
        "created_by": current_user.id,
        "created_by_name": current_user.full_name,
        "created_at": record.created_at,
    }


@router.get("/numbers", response_model=list[GeneratedNumberResponse])
def list_generated_numbers(
    company_id: int | None = None,
    document_type: str | None = Query(default=None, pattern="^(CTR|INV)$"),
    year: int | None = Query(default=None, ge=2000, le=9999),
    search: str | None = Query(default=None, max_length=80),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = (
        db.query(GeneratedNumber, Company, User)
        .join(Company, Company.id == GeneratedNumber.company_id)
        .join(User, User.id == GeneratedNumber.created_by)
    )
    if company_id is not None:
        query = query.filter(GeneratedNumber.company_id == company_id)
    if document_type:
        query = query.filter(GeneratedNumber.document_type == document_type)
    if year:
        query = query.filter(GeneratedNumber.year == year)
    if search:
        escaped = re.sub(r"[%_\\]", lambda match: "\\" + match.group(0), search.strip())
        query = query.filter(GeneratedNumber.number.ilike(f"%{escaped}%", escape="\\"))
    rows = query.order_by(GeneratedNumber.created_at.desc(), GeneratedNumber.id.desc()).limit(limit).all()
    return [
        {
            "id": record.id,
            "company_id": company.id,
            "company_name": company.name,
            "company_code": company.code,
            "document_type": record.document_type,
            "year": record.year,
            "serial": record.serial,
            "number": record.number,
            "created_by": user.id,
            "created_by_name": user.full_name,
            "created_at": record.created_at,
        }
        for record, company, user in rows
    ]
