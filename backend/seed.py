"""Seed script to populate initial data for development."""
import sys
sys.path.insert(0, ".")

from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models import *  # noqa: F403


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Create users
    users_data = [
        {
            "email": "admin@erp.local",
            "full_name": "System Admin",
            "role": "management",
            "department": "Management",
        },
        {
            "email": "pm@erp.local",
            "full_name": "Ahmed Hassan",
            "role": "project_manager",
            "department": "Engineering",
        },
        {
            "email": "pc@erp.local",
            "full_name": "Sara Ali",
            "role": "project_controller",
            "department": "Engineering",
        },
        {
            "email": "eng@erp.local",
            "full_name": "Mohammed Khalid",
            "role": "employee",
            "department": "Engineering",
        },
        {
            "email": "dm@erp.local",
            "full_name": "Fatima Omar",
            "role": "department_manager",
            "department": "Procurement",
        },
    ]

    existing = db.query(User).first()
    if existing:
        print("Database already seeded.")
        db.close()
        return

    for u in users_data:
        user = User(
            email=u["email"],
            full_name=u["full_name"],
            hashed_password=get_password_hash("password123"),
            role=u["role"],
            department=u["department"],
        )
        db.add(user)

    db.commit()

    # Create sample suppliers
    suppliers_data = [
        {"name": "Al-Faisal Trading", "supplier_type": "local", "country": "Saudi Arabia"},
        {"name": "Dragon Steel Co.", "supplier_type": "international", "country": "China"},
        {"name": "Gulf Logistics", "supplier_type": "local", "country": "UAE"},
    ]
    for s in suppliers_data:
        supplier = Supplier(**s)
        db.add(supplier)

    db.commit()

    # Create sample project
    pm = db.query(User).filter(User.role == "project_manager").first()
    pc = db.query(User).filter(User.role == "project_controller").first()

    project = Project(
        project_code="PRJ-2024-001",
        project_name="Al-Riyadh Industrial Complex - Phase 1",
        customer="Saudi Industrial Corp",
        beneficiary="Ministry of Industry",
        contact_name="Eng. Abdullah",
        contact_email="abdullah@sic.sa",
        contact_phone="+966-50-1234567",
        description="Construction of industrial complex with full MEP systems",
        status="boq_preparation",
        project_manager_id=pm.id if pm else None,
        project_controller_id=pc.id if pc else None,
        exchange_rate=3.75,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    # Create sample BOQ
    boq = BOQ(
        project_id=project.id,
        version=1,
        exchange_rate=3.75,
        created_by_id=pm.id if pm else None,
    )
    db.add(boq)
    db.commit()
    db.refresh(boq)

    sections = [
        ("Materials", [
            ("Steel Structure - Main Frame", 150, "TON", 2500, 3200),
            ("Electrical Cables - HV", 5000, "M", 45, 65),
            ("HVAC Units - 5TR", 20, "PCS", 8000, 11000),
        ]),
        ("Civil Works", [
            ("Foundation Concrete - Grade 40", 800, "M3", 350, 500),
            ("Block Work - 200mm", 2000, "M2", 85, 130),
        ]),
        ("Installation", [
            ("Steel Erection", 150, "TON", 800, 1200),
            ("Electrical Installation", 1, "LOT", 150000, 220000),
        ]),
        ("Logistics", [
            ("International Shipping - Container", 10, "CNT", 5000, 7500),
            ("Local Transport", 1, "LOT", 25000, 35000),
        ]),
    ]

    total_cost = 0
    total_selling = 0
    for idx, (section_name, items) in enumerate(sections):
        section = BOQSection(
            boq_id=boq.id,
            section_name=section_name,
            sort_order=idx,
        )
        db.add(section)
        db.commit()
        db.refresh(section)

        for desc, qty, unit, cost, sell in items:
            profit_pct = round(((sell - cost) / cost) * 100, 2) if cost > 0 else 0
            item = BOQItem(
                section_id=section.id,
                description=desc,
                quantity=qty,
                unit=unit,
                unit_cost=cost,
                selling_price=sell,
                profit_percentage=profit_pct,
            )
            total_cost += qty * cost
            total_selling += qty * sell
            db.add(item)

    boq.total_cost = total_cost
    boq.total_selling = total_selling
    boq.profit = total_selling - total_cost
    db.commit()

    print(f"Seed complete!")
    print(f"  Users: {len(users_data)}")
    print(f"  Suppliers: {len(suppliers_data)}")
    print(f"  Projects: 1")
    print(f"  BOQ V1: {len(sections)} sections, cost={total_cost:,.2f}, selling={total_selling:,.2f}")
    print(f"\nLogin credentials (all users): password123")
    print(f"  Admin: admin@erp.local")
    print(f"  PM: pm@erp.local")
    print(f"  PC: pc@erp.local")

    db.close()


if __name__ == "__main__":
    seed()
