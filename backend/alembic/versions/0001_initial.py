"""Initial migration placeholder.

Production: run `alembic revision --autogenerate -m \"...\"` then `alembic upgrade head`.
Fallback: app startup runs Base.metadata.create_all().
"""
revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass
