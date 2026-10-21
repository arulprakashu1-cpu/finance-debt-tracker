# Finance & Debt Tracker

Personal finance dashboard specialized for liability types most apps ignore:
gold loans, chit funds, and traditional home/education loans, plus a budget
planner and a multi-channel due-date alert engine.

Owner / default alert recipient: arulprakashu@gmail.com, WhatsApp +91 95974 70788.

## Stack

- **Frontend**: React + Vite + TailwindCSS (`frontend/`)
- **Backend**: Python FastAPI + SQLAlchemy (`backend/`)
- **Database**: PostgreSQL
- **Notifications**: Twilio (SMS/WhatsApp), SendGrid (email)

## Flagship feature

`GET /analytics/opportunity-cost` (Analytics page in the UI) — the "Liquid
Liquidation & Dividend Optimizer": compares an active chit fund's dividend
against your highest-interest gold loan and estimates how much of that
loan's monthly interest the dividend could clear.

## Running it locally

### 1. Database

Create a local Postgres database (or use a Docker container):

```
createdb finance_tracker
```

### 2. Backend

Requires Python 3.11+ (not currently installed on this machine — install
from python.org or the Microsoft Store before continuing).

```
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env   # edit DATABASE_URL / Twilio / SendGrid keys as needed
uvicorn app.main:app --reload
```

API docs: http://localhost:8000/docs. Tables are created automatically on
startup (`Base.metadata.create_all`) — swap in Alembic migrations before
this goes anywhere near production data.

### 3. Frontend

```
cd frontend
npm install
copy .env.example .env
npm run dev
```

App: http://localhost:5173

## What's scaffolded vs. what's left

Implemented: CRUD for gold loans, chit funds, and traditional loans; budget
plans with expense tracking and a burndown endpoint; an alerts table with
send/escalation endpoints wired to Twilio/SendGrid (no-ops until API keys
are set); the opportunity-cost analytics endpoint; a full React UI for all
of the above.

Not yet built (left as deliberate next steps, not oversights):
- Scheduled background job to auto-create alerts N days before due dates
  (the `alerts` table and `/alerts/{id}/send` endpoint exist; nothing calls
  them on a timer yet — add a cron/APScheduler job in `backend/app`).
- Auth/multi-user support (this is scaffolded as a single-owner app).
- Alembic migration setup (currently relies on `create_all`).
- Visual burndown chart on the Budget page (data is there; it's rendered as
  stat cards, not a chart, yet).
