"""Add deposit_requests + card_requests, extend loans for approval workflow.

Revision 0002. Uses create_all-compatible DDL via SQLAlchemy metadata where
possible; raw SQL fallback keeps SQLite + Postgres working.
"""
revision = "0002_requests"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade():
    from app.db.base import Base
    from app.db.session import engine
    # ensure models registered
    from app.models import all as _m  # noqa: F401
    Base.metadata.create_all(bind=engine, tables=[
        Base.metadata.tables["deposit_requests"],
        Base.metadata.tables["card_requests"],
    ])
    # extend loans with new nullable columns (idempotent)
    import sqlalchemy as sa
    insp = sa.inspect(engine)
    cols = {c["name"] for c in insp.get_columns("loans")}
    with engine.begin() as conn:
        if "account_id" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN account_id INTEGER"))
        if "approved_amount" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN approved_amount NUMERIC(18,2)"))
        if "purpose" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN purpose VARCHAR(500) DEFAULT ''"))
        if "monthly_income" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN monthly_income NUMERIC(18,2)"))
        if "employment_info" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN employment_info VARCHAR(500) DEFAULT ''"))
        if "reviewed_by" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN reviewed_by INTEGER"))
        if "review_note" not in cols:
            conn.execute(sa.text("ALTER TABLE loans ADD COLUMN review_note VARCHAR(500) DEFAULT ''"))


def downgrade():
    pass
