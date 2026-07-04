# Enterprise Project Lifecycle ERP

A full-stack ERP system for engineering/procurement/construction companies, managing the complete project lifecycle from initiation through closure.

## Architecture

- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS
- **Database**: PostgreSQL 14+
- **Auth**: JWT-based with role-based access control

## Core Modules

| Module | Description |
|--------|-------------|
| **Projects** | Full lifecycle management with status tracking |
| **BOQ** | Versioned Bill of Quantities with sections & items |
| **Procurement** | Purchase Requests, Orders, Supplier management, RFQ comparisons |
| **Warehouse** | GRN, Stock management, Material issues (no direct delivery) |
| **Execution** | Phase tracking with progress percentages |
| **Finance** | Invoices, Payment schedules (percentage-based) |
| **Approval** | Management gate for BOQ approval before customer send |
| **Audit** | Full change tracking (who, when, what, why) |
| **Dashboard** | Role-based KPIs and project summaries |

## Quick Start

### Using Docker Compose

```bash
docker-compose up -d
```

### Manual Setup

1. **PostgreSQL**:
```bash
createdb erp_db
createuser erp_user -P  # password: erp_password
```

2. **Backend**:
```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e .
python seed.py        # Creates sample data
uvicorn app.main:app --reload
```

3. **Frontend**:
```bash
cd frontend
npm install
npm run dev
```

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Management | admin@erp.local | password123 |
| Project Manager | pm@erp.local | password123 |
| Project Controller | pc@erp.local | password123 |
| Employee | eng@erp.local | password123 |
| Department Manager | dm@erp.local | password123 |

## API Documentation

Once running, visit: http://localhost:8000/docs

## Project Workflow

```
Project Intake → Requirements → BOQ Preparation (Versioned) → Internal Review
→ Management Approval (GATE) → Customer Proposal → Customer Response
→ Repricing (if needed) → Procurement → Warehouse → Execution
→ Progress Tracking → Invoicing → Closure
```

## Key Business Rules

- Single customer per project
- All materials MUST pass through warehouse (GRN → Stock → Issue)
- Every BOQ item traceable to procurement
- No BOQ sent to customer without Management approval
- No hard deletes (soft delete with audit trail)
- Full version history for BOQ changes
