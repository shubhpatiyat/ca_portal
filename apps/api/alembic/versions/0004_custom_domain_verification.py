"""add custom domain verification fields

Revision ID: 0004_custom_domains
Revises: 0003_contact_details
Create Date: 2026-07-06
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_custom_domains"
down_revision = "0003_contact_details"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("domains", sa.Column("domain_type", sa.String(32), nullable=False, server_default="platform"))
    op.add_column("domains", sa.Column("verification_status", sa.String(32), nullable=False, server_default="verified"))
    op.add_column("domains", sa.Column("verification_token", sa.String(120), nullable=True))
    op.add_column("domains", sa.Column("verification_record_name", sa.String(255), nullable=True))
    op.add_column("domains", sa.Column("verification_record_value", sa.String(255), nullable=True))
    op.add_column("domains", sa.Column("dns_target", sa.String(255), nullable=True))
    op.add_column("domains", sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("domains", sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("domains", "last_checked_at")
    op.drop_column("domains", "verified_at")
    op.drop_column("domains", "dns_target")
    op.drop_column("domains", "verification_record_value")
    op.drop_column("domains", "verification_record_name")
    op.drop_column("domains", "verification_token")
    op.drop_column("domains", "verification_status")
    op.drop_column("domains", "domain_type")
