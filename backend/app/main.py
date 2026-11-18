from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.api import (
    audit,
    auth,
    boq,
    dashboard,
    execution,
    finance,
    numbering,
    procurement,
    projects,
    users,
    warehouse,
)
from app.core.config import settings
from app.core.database import Base, SessionLocal, engine
from app.models.numbering import Company

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (
    auth,
    users,
    projects,
    boq,
    procurement,
    warehouse,
    execution,
    finance,
    dashboard,
    audit,
    numbering,
):
    app.include_router(module.router, prefix=settings.API_V1_PREFIX)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        default_company = db.query(Company).filter(Company.code == "AN").first()
        if default_company is None:
            db.add(Company(name="شركة الأنوار", code="AN"))
            db.commit()


@app.get("/")
def root():
    return {"name": settings.PROJECT_NAME, "version": settings.VERSION, "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "healthy"}
