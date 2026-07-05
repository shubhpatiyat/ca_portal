"""add website contact details

Revision ID: 0003_contact_details
Revises: 0002_section_admin_label
Create Date: 2026-07-05
"""
from alembic import op
import sqlalchemy as sa

revision = "0003_contact_details"
down_revision = "0002_section_admin_label"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "website_configs",
        sa.Column("contact_phone", sa.String(32), nullable=False, server_default="+91 90000 12345"),
    )
    op.add_column(
        "website_configs",
        sa.Column("contact_whatsapp", sa.String(120), nullable=False, server_default="https://wa.me/919000012345"),
    )
    op.add_column(
        "website_configs",
        sa.Column("contact_email", sa.String(255), nullable=False, server_default="office@example.com"),
    )
    op.add_column(
        "website_configs",
        sa.Column(
            "contact_address",
            sa.String(240),
            nullable=False,
            server_default="Office address configured during onboarding",
        ),
    )


def downgrade() -> None:
    op.drop_column("website_configs", "contact_address")
    op.drop_column("website_configs", "contact_email")
    op.drop_column("website_configs", "contact_whatsapp")
    op.drop_column("website_configs", "contact_phone")
