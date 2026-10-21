import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import alerts, analytics, budget, chit_funds, gold_loans, traditional_loans

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Personal Finance & Debt Tracker", version="0.1.0")

allowed_origins = ["http://localhost:5173"]
if os.environ.get("FRONTEND_URL"):
    allowed_origins.append(os.environ["FRONTEND_URL"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_origin_regex=r"https://.*\.vercel\.app" if not os.environ.get("FRONTEND_URL") else None,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(gold_loans.router)
app.include_router(chit_funds.router)
app.include_router(traditional_loans.router)
app.include_router(budget.router)
app.include_router(alerts.router)
app.include_router(analytics.router)


@app.get("/health")
def health():
    return {"status": "ok"}
