"""One-time data migration: copies every row from the local SQLite database
into a fresh Postgres database, table by table, preserving primary keys.
Run locally once the Render Postgres instance exists:

    python migrate_to_postgres.py "postgresql://user:pass@host/dbname"
"""
import sys

from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

from app import models
from app.database import Base

SQLITE_PATH = "finance_tracker.db"

MODEL_ORDER = [
    models.GoldLoan,
    models.ChitFund,
    models.ChitMember,
    models.ChitAuctionCycle,
    models.ChitCyclePayment,
    models.TraditionalLoan,
    models.LoanPayment,
    models.BudgetPlan,
    models.Expense,
    models.Alert,
]


def main():
    if len(sys.argv) != 2:
        print("Usage: python migrate_to_postgres.py <postgres-connection-string>")
        sys.exit(1)
    pg_url = sys.argv[1]

    sqlite_engine = create_engine(f"sqlite:///{SQLITE_PATH}")
    pg_engine = create_engine(pg_url)

    Base.metadata.create_all(bind=pg_engine)

    SqliteSession = sessionmaker(bind=sqlite_engine)
    PgSession = sessionmaker(bind=pg_engine)
    src = SqliteSession()
    dst = PgSession()

    for model in MODEL_ORDER:
        rows = src.query(model).all()
        count = 0
        for row in rows:
            data = {c.key: getattr(row, c.key) for c in inspect(model).mapper.column_attrs}
            dst.merge(model(**data))
            count += 1
        dst.commit()
        print(f"{model.__tablename__}: {count} rows migrated")

    src.close()
    dst.close()
    print("Done.")


if __name__ == "__main__":
    main()
