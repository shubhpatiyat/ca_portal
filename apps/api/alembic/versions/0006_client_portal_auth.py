"""add client portal auth fields

Revision ID: 0006_client_portal_auth
Revises: 0005_client_manager
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa

revision = "0006_client_portal_auth"
down_revision = "0005_client_manager"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("firm_clients", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("firm_clients", sa.Column("password_generated_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("firm_clients", sa.Column("must_reset_password", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column("firm_clients", sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True))


def downgrade() -> None:
    op.drop_column("firm_clients", "last_login_at")
    op.drop_column("firm_clients", "must_reset_password")
    op.drop_column("firm_clients", "password_generated_at")
    op.drop_column("firm_clients", "password_hash")
