from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.organization import TimestampMixin


class FirmClient(Base, TimestampMixin):
    __tablename__ = "firm_clients"
    __table_args__ = (UniqueConstraint("organization_id", "mobile", name="uq_firm_client_mobile"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    mobile: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    portal_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)
    mobile_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    password_generated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    must_reset_password: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    companies: Mapped[list["ClientCompany"]] = relationship(back_populates="client", cascade="all, delete-orphan", passive_deletes=True)
    documents: Mapped[list["CompanyDocument"]] = relationship(back_populates="client", cascade="all, delete-orphan", passive_deletes=True)


class ClientCompany(Base, TimestampMixin):
    __tablename__ = "client_companies"
    __table_args__ = (UniqueConstraint("organization_id", "client_id", "company_name", name="uq_client_company_name"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("firm_clients.id", ondelete="CASCADE"), nullable=False, index=True)
    company_name: Mapped[str] = mapped_column(String(180), nullable=False)
    company_type: Mapped[str] = mapped_column(String(40), nullable=False)
    registered_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    registration_number: Mapped[str | None] = mapped_column(String(80), nullable=True)
    registered_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    pan: Mapped[str | None] = mapped_column(String(20), nullable=True)
    gst: Mapped[str | None] = mapped_column(String(30), nullable=True)
    other_id_type: Mapped[str | None] = mapped_column(String(80), nullable=True)
    other_id_value: Mapped[str | None] = mapped_column(String(120), nullable=True)
    portal_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_upload: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_download: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_view_billing: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_view_tally: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    client: Mapped[FirmClient] = relationship(back_populates="companies")
    documents: Mapped[list["CompanyDocument"]] = relationship(back_populates="company", cascade="all, delete-orphan", passive_deletes=True)


class CompanyDocument(Base, TimestampMixin):
    __tablename__ = "company_documents"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("firm_clients.id", ondelete="CASCADE"), nullable=False, index=True)
    company_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("client_companies.id", ondelete="CASCADE"), nullable=False, index=True)
    financial_year: Mapped[str] = mapped_column(String(16), nullable=False)
    month: Mapped[str | None] = mapped_column(String(20), nullable=True)
    document_type: Mapped[str] = mapped_column(String(80), nullable=False)
    document_name: Mapped[str] = mapped_column(String(180), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="requested", nullable=False)
    visible_to_client: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    allow_client_upload: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    allow_client_download: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    storage_provider: Mapped[str] = mapped_column(String(40), default="app", nullable=False)
    storage_drive_id: Mapped[str | None] = mapped_column(String(180), nullable=True)
    storage_file_id: Mapped[str | None] = mapped_column(String(220), nullable=True)
    storage_folder_id: Mapped[str | None] = mapped_column(String(220), nullable=True)
    storage_path: Mapped[str | None] = mapped_column(String(700), nullable=True)
    web_url: Mapped[str | None] = mapped_column(String(900), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(120), nullable=True)
    size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    client: Mapped[FirmClient] = relationship(back_populates="documents")
    company: Mapped[ClientCompany] = relationship(back_populates="documents")
    upload_sessions: Mapped[list["DocumentUploadSession"]] = relationship(back_populates="document", cascade="all, delete-orphan", passive_deletes=True)


class DocumentUploadSession(Base):
    __tablename__ = "document_upload_sessions"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("company_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    uploaded_by_kind: Mapped[str] = mapped_column(String(20), nullable=False)
    uploaded_by_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_bytes: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    provider_upload_session_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    provider_file_id: Mapped[str | None] = mapped_column(String(220), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    document: Mapped[CompanyDocument] = relationship(back_populates="upload_sessions")
