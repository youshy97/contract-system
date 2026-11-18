from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    code: str = Field(min_length=2, max_length=12, pattern=r"^[A-Za-z0-9]+$")

    @field_validator("name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        return value.strip()

    @field_validator("code")
    @classmethod
    def normalize_code(cls, value: str) -> str:
        return value.strip().upper()


class CompanyResponse(BaseModel):
    id: int
    name: str
    code: str
    is_active: bool

    model_config = {"from_attributes": True}


class GenerateNumberRequest(BaseModel):
    company_id: int
    document_type: str

    @field_validator("document_type")
    @classmethod
    def validate_document_type(cls, value: str) -> str:
        value = value.strip().upper()
        if value not in {"CTR", "INV"}:
            raise ValueError("نوع المستند يجب أن يكون CTR أو INV")
        return value


class GeneratedNumberResponse(BaseModel):
    id: int
    company_id: int
    company_name: str
    company_code: str
    document_type: str
    year: int
    serial: int
    number: str
    created_by: int
    created_by_name: str
    created_at: datetime

    model_config = {"from_attributes": True}
