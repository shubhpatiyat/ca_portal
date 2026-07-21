"""add domain provisioning state

Revision ID: 0007_domain_provisioning
Revises: 0006_client_portal_auth
Create Date: 2026-07-21
"""
from alembic import op
import sqlalchemy as sa

revision = "0007_domain_provisioning"
down_revision = "0006_client_portal_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("domains", sa.Column("dns_record_type", sa.String(16), nullable=True))
    op.add_column("domains", sa.Column("provisioning_status", sa.String(48), nullable=False, server_default="pending_ownership"))
    op.add_column("domains", sa.Column("provider_verification_record_name", sa.String(255), nullable=True))
    op.add_column("domains", sa.Column("provider_verification_record_value", sa.String(255), nullable=True))
    op.add_column("domains", sa.Column("provider_error", sa.String(500), nullable=True))
    op.add_column("domains", sa.Column("provider_checked_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE domains SET provisioning_status = 'ready' WHERE domain_type = 'platform'")
    op.execute("UPDATE domains SET provisioning_status = 'provisioning' WHERE domain_type = 'custom' AND is_verified = true")


def downgrade() -> None:
    op.drop_column("domains", "provider_checked_at")
    op.drop_column("domains", "provider_error")
    op.drop_column("domains", "provider_verification_record_value")
    op.drop_column("domains", "provider_verification_record_name")
    op.drop_column("domains", "provisioning_status")
    op.drop_column("domains", "dns_record_type")
