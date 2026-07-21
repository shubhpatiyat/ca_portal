from datetime import datetime
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class Organization(Base, TimestampMixin):
    __tablename__ = "organizations"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    slug: Mapped[str] = mapped_column(String(140), unique=True, nullable=False, index=True)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="active", nullable=False)

    members: Mapped[list["OrganizationMember"]] = relationship(back_populates="organization", cascade="all, delete-orphan")
    website_config: Mapped["WebsiteConfig"] = relationship(back_populates="organization", uselist=False, cascade="all, delete-orphan")
    domains: Mapped[list["Domain"]] = relationship(back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)
    pages: Mapped[list["WebsitePage"]] = relationship(back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)
    media_assets: Mapped[list["MediaAsset"]] = relationship(back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)
    leads: Mapped[list["Lead"]] = relationship(back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)
    audit_logs: Mapped[list["AuditLog"]] = relationship(back_populates="organization", cascade="all, delete-orphan", passive_deletes=True)


class OrganizationMember(Base):
    __tablename__ = "organization_members"
    __table_args__ = (UniqueConstraint("organization_id", "user_id", name="uq_org_member_user"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(32), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="members")


class WebsiteConfig(Base, TimestampMixin):
    __tablename__ = "website_configs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), unique=True, nullable=False)
    template_key: Mapped[str] = mapped_column(String(64), nullable=False)
    theme_key: Mapped[str] = mapped_column(String(64), nullable=False)
    logo_asset_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("media_assets.id"), nullable=True)
    default_subdomain: Mapped[str | None] = mapped_column(String(120), nullable=True)
    published_revision_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    contact_phone: Mapped[str] = mapped_column(String(32), default="+91 90000 12345", nullable=False)
    contact_whatsapp: Mapped[str] = mapped_column(String(120), default="https://wa.me/919000012345", nullable=False)
    contact_email: Mapped[str] = mapped_column(String(255), default="office@example.com", nullable=False)
    contact_address: Mapped[str] = mapped_column(String(240), default="Office address configured during onboarding", nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="website_config")


class Domain(Base):
    __tablename__ = "domains"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    hostname: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    domain_type: Mapped[str] = mapped_column(String(32), default="custom", nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(32), default="pending", nullable=False)
    verification_token: Mapped[str | None] = mapped_column(String(120), nullable=True)
    verification_record_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    verification_record_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dns_target: Mapped[str | None] = mapped_column(String(255), nullable=True)
    dns_record_type: Mapped[str | None] = mapped_column(String(16), nullable=True)
    provisioning_status: Mapped[str] = mapped_column(String(48), default="pending_ownership", nullable=False)
    provider_verification_record_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_verification_record_value: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider_error: Mapped[str | None] = mapped_column(String(500), nullable=True)
    provider_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_checked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="domains")


class WebsitePage(Base, TimestampMixin):
    __tablename__ = "website_pages"
    __table_args__ = (UniqueConstraint("organization_id", "slug", name="uq_org_page_slug"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(80), nullable=False)
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    current_draft_revision_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    current_published_revision_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)

    organization: Mapped[Organization] = relationship(back_populates="pages")
    revisions: Mapped[list["PageRevision"]] = relationship(back_populates="page", cascade="all, delete-orphan", passive_deletes=True)


class PageRevision(Base):
    __tablename__ = "page_revisions"
    __table_args__ = (UniqueConstraint("page_id", "version_number", name="uq_page_version"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    page_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("website_pages.id", ondelete="CASCADE"), nullable=False, index=True)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    created_by_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    page: Mapped[WebsitePage] = relationship(back_populates="revisions")
    sections: Mapped[list["PageSection"]] = relationship(back_populates="revision", cascade="all, delete-orphan", passive_deletes=True)


class PageSection(Base, TimestampMixin):
    __tablename__ = "page_sections"
    __table_args__ = (UniqueConstraint("revision_id", "position", name="uq_revision_position"),)

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    revision_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("page_revisions.id", ondelete="CASCADE"), nullable=False, index=True)
    admin_label: Mapped[str | None] = mapped_column(String(80), nullable=True)
    section_type: Mapped[str] = mapped_column(String(64), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    variant: Mapped[str] = mapped_column(String(64), nullable=False)
    content_json: Mapped[dict] = mapped_column(JSONB, nullable=False)

    revision: Mapped[PageRevision] = relationship(back_populates="sections")


class MediaAsset(Base):
    __tablename__ = "media_assets"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    public_url: Mapped[str] = mapped_column(String(700), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(80), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)
    uploaded_by_user_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="media_assets")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(140), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    service_interest: Mapped[str | None] = mapped_column(String(140), nullable=True)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_page_slug: Mapped[str] = mapped_column(String(80), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="new", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="leads")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    organization_id: Mapped[str] = mapped_column(UUID(as_uuid=False), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    actor_user_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), nullable=True)
    action: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str] = mapped_column(UUID(as_uuid=False), nullable=False)
    metadata_json: Mapped[dict] = mapped_column("metadata", JSONB, default=dict, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="audit_logs")
