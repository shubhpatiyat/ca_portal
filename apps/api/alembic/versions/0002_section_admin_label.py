"""add admin section labels

Revision ID: 0002_section_admin_label
Revises: 0001_initial
Create Date: 2026-07-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0002_section_admin_label"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("page_sections", sa.Column("admin_label", sa.String(80), nullable=True))


def downgrade() -> None:
    op.drop_column("page_sections", "admin_label")
