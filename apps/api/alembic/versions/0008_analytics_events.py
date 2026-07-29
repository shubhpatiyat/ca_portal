"""add tenant analytics events

Revision ID: 0008_analytics_events
Revises: 0007_domain_provisioning
Create Date: 2026-07-29
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0008_analytics_events"
down_revision = "0007_domain_provisioning"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "analytics_events",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("event_type", sa.String(length=40), nullable=False),
        sa.Column("page_slug", sa.String(length=80), nullable=True),
        sa.Column("hostname", sa.String(length=255), nullable=True),
        sa.Column("session_id_hash", sa.String(length=64), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_analytics_org_created", "analytics_events", ["organization_id", "created_at"])
    op.create_index(
        "ix_analytics_org_type_created",
        "analytics_events",
        ["organization_id", "event_type", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_analytics_org_type_created", table_name="analytics_events")
    op.drop_index("ix_analytics_org_created", table_name="analytics_events")
    op.drop_table("analytics_events")
