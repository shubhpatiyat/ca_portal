"""add client company document manager

Revision ID: 0005_client_manager
Revises: 0004_custom_domains
Create Date: 2026-07-13
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0005_client_manager"
down_revision = "0004_custom_domains"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "firm_clients",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(140), nullable=False),
        sa.Column("mobile", sa.String(32), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("address", sa.String(300), nullable=True),
        sa.Column("city", sa.String(100), nullable=True),
        sa.Column("state", sa.String(100), nullable=True),
        sa.Column("portal_enabled", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("status", sa.String(32), nullable=False, server_default="active"),
        sa.Column("mobile_verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "mobile", name="uq_firm_client_mobile"),
    )
    op.create_index("ix_firm_clients_organization_id", "firm_clients", ["organization_id"])

    op.create_table(
        "client_companies",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("firm_clients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_name", sa.String(180), nullable=False),
        sa.Column("company_type", sa.String(40), nullable=False),
        sa.Column("registered_address", sa.String(300), nullable=True),
        sa.Column("registration_number", sa.String(80), nullable=True),
        sa.Column("registered_email", sa.String(255), nullable=True),
        sa.Column("pan", sa.String(20), nullable=True),
        sa.Column("gst", sa.String(30), nullable=True),
        sa.Column("other_id_type", sa.String(80), nullable=True),
        sa.Column("other_id_value", sa.String(120), nullable=True),
        sa.Column("portal_visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_upload", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_download", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("can_view_billing", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("can_view_tally", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("organization_id", "client_id", "company_name", name="uq_client_company_name"),
    )
    op.create_index("ix_client_companies_organization_id", "client_companies", ["organization_id"])
    op.create_index("ix_client_companies_client_id", "client_companies", ["client_id"])

    op.create_table(
        "company_documents",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("client_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("firm_clients.id", ondelete="CASCADE"), nullable=False),
        sa.Column("company_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False),
        sa.Column("financial_year", sa.String(16), nullable=False),
        sa.Column("month", sa.String(20), nullable=True),
        sa.Column("document_type", sa.String(80), nullable=False),
        sa.Column("document_name", sa.String(180), nullable=False),
        sa.Column("status", sa.String(32), nullable=False, server_default="requested"),
        sa.Column("visible_to_client", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("allow_client_upload", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("allow_client_download", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("storage_provider", sa.String(40), nullable=False, server_default="onedrive"),
        sa.Column("storage_drive_id", sa.String(180), nullable=True),
        sa.Column("storage_file_id", sa.String(220), nullable=True),
        sa.Column("storage_folder_id", sa.String(220), nullable=True),
        sa.Column("storage_path", sa.String(700), nullable=True),
        sa.Column("web_url", sa.String(900), nullable=True),
        sa.Column("mime_type", sa.String(120), nullable=True),
        sa.Column("size_bytes", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_company_documents_organization_id", "company_documents", ["organization_id"])
    op.create_index("ix_company_documents_client_id", "company_documents", ["client_id"])
    op.create_index("ix_company_documents_company_id", "company_documents", ["company_id"])

    op.create_table(
        "document_upload_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=False), primary_key=True),
        sa.Column("organization_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=False), sa.ForeignKey("company_documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("uploaded_by_kind", sa.String(20), nullable=False),
        sa.Column("uploaded_by_user_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("uploaded_bytes", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(32), nullable=False, server_default="pending"),
        sa.Column("provider_upload_session_url", sa.Text(), nullable=True),
        sa.Column("provider_file_id", sa.String(220), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_document_upload_sessions_organization_id", "document_upload_sessions", ["organization_id"])
    op.create_index("ix_document_upload_sessions_document_id", "document_upload_sessions", ["document_id"])


def downgrade() -> None:
    op.drop_table("document_upload_sessions")
    op.drop_table("company_documents")
    op.drop_table("client_companies")
    op.drop_table("firm_clients")
