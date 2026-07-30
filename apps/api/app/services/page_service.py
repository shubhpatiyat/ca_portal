from datetime import datetime, timezone
from urllib.parse import urlsplit
from uuid import uuid4

import httpx
from fastapi import HTTPException, status
from pydantic import TypeAdapter, ValidationError
from sqlalchemy import func, select, update
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import (
    AuditLog,
    Domain,
    Organization,
    OrganizationMember,
    PageRevision,
    PageSection as PageSectionModel,
    WebsiteConfig,
    WebsitePage,
)
from app.schemas.admin import OnboardingRequest, TenantContext
from app.schemas.public import ContactDetails, LegalDocuments, PublicSitePage, SeoPayload
from app.schemas.sections import PageSection, validate_sections
from app.services.default_content import default_home_sections, slugify
from app.services.section_assets import assert_assets_belong_to_org

section_list_adapter = TypeAdapter(list[PageSection])


def validate_section_list(value: list[dict] | list[PageSection]) -> list[PageSection]:
    return validate_sections(section_list_adapter.validate_python(value))

RESERVED_SUBDOMAINS = {
    "admin",
    "api",
    "app",
    "auth",
    "billing",
    "dashboard",
    "docs",
    "help",
    "login",
    "mail",
    "settings",
    "status",
    "support",
    "www",
}

LEGAL_DOCUMENT_PAGES = {
    "privacy_policy": ("privacy-policy", "Privacy Policy"),
    "terms_of_service": ("terms-of-service", "Terms of Service"),
    "nda_confidentiality": ("nda-confidentiality", "NDA & Confidentiality Commitment"),
}


def normalize_hostname(value: str | None) -> str:
    host = (value or "").split(",")[0].strip().lower()
    if not host:
        return ""
    if "://" in host:
        host = urlsplit(host).netloc
    if host.startswith("["):
        return host.split("]")[0].strip("[]")
    return host.split(":")[0].strip(".")


def normalize_platform_domain(value: str | None) -> str:
    host = normalize_hostname(value)
    if host.startswith("*."):
        host = host[2:]
    return host


def normalize_platform_display_domain(value: str | None) -> str:
    host = (value or "").split(",")[0].strip().lower()
    if not host:
        return ""
    if "://" in host:
        host = urlsplit(host).netloc
    host = host.split("/")[0].strip(".")
    if host.startswith("*."):
        host = host[2:]
    return host


def build_platform_hostname(subdomain: str, settings: Settings) -> str:
    platform_domain = normalize_platform_domain(settings.platform_domain)
    if not platform_domain:
        return normalize_hostname(subdomain)
    return f"{normalize_hostname(subdomain)}.{platform_domain}"


def build_platform_url(subdomain: str | None, settings: Settings) -> str | None:
    if not subdomain:
        return None
    platform_domain = normalize_platform_display_domain(settings.platform_domain)
    hostname = normalize_hostname(subdomain)
    if not hostname:
        return None
    if platform_domain:
        hostname = f"{hostname}.{platform_domain}"
    scheme = settings.platform_scheme.rstrip(":/") or "https"
    return f"{scheme}://{hostname}"


def build_whatsapp_url(value: str) -> str:
    cleaned = value.strip()
    if cleaned.startswith("https://wa.me/"):
        return cleaned
    digits = "".join(char for char in cleaned if char.isdigit())
    if not digits:
        return "https://wa.me/919000012345"
    return f"https://wa.me/{digits}"


def build_seo_copy(
    page_slug: str,
    page_title: str,
    firm_name: str,
    city: str,
    founder_name: str | None = None,
) -> tuple[str, str]:
    if page_slug == "home":
        title = (
            f"{founder_name}, Chartered Accountant in {city} | {firm_name}"
            if founder_name
            else f"Chartered Accountant in {city} | {firm_name}"
        )
        description = (
            f"{firm_name} provides income tax, GST, accounting, audit and compliance services "
            f"for businesses, professionals and individuals in {city}."
        )
        return title, description
    if page_slug == "services":
        return (
            f"CA Services in {city} | {firm_name}",
            f"Explore income tax, GST, accounting, audit and compliance services from {firm_name} in {city}.",
        )
    if page_slug == "about":
        return (
            f"About {firm_name} | Chartered Accountant in {city}",
            f"Learn about {firm_name} and its professional tax, accounting and compliance services in {city}.",
        )
    if page_slug == "contact":
        return (
            f"Contact {firm_name} | Chartered Accountant in {city}",
            f"Contact {firm_name} for income tax, GST, accounting, audit and compliance services in {city}.",
        )
    return f"{page_title} | {firm_name}", f"{page_title} information from {firm_name} in {city}."


class PageService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_onboarding_site(self, payload: OnboardingRequest, user_id: str, settings: Settings) -> Organization:
        existing_membership = self.db.execute(
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(OrganizationMember.created_at.asc())
        ).scalars().first()
        if existing_membership:
            self._ensure_default_domain(existing_membership, settings)
            self.db.commit()
            return existing_membership

        organization_slug = self._unique_organization_slug(slugify(payload.firmName))
        default_subdomain = self._unique_default_subdomain(slugify(payload.firmName), settings)
        organization = Organization(
            name=payload.firmName,
            slug=organization_slug,
            city=payload.city,
            status="active",
        )
        self.db.add(organization)
        self.db.flush()

        self.db.add(OrganizationMember(organization_id=organization.id, user_id=user_id, role="owner"))
        config = WebsiteConfig(
            organization_id=organization.id,
            template_key=payload.templateKey,
            theme_key=payload.themeKey,
            default_subdomain=default_subdomain,
            contact_phone=payload.phone,
            contact_whatsapp=build_whatsapp_url(payload.whatsapp),
            contact_email=str(payload.email),
            contact_address=payload.address,
        )
        self.db.add(config)
        self._ensure_default_domain(organization, settings, default_subdomain)
        page = WebsitePage(organization_id=organization.id, slug="home", title="Home")
        self.db.add(page)
        self.db.flush()
        draft_revision = PageRevision(page_id=page.id, version_number=1, status="draft", created_by_user_id=user_id)
        published_revision = PageRevision(
            page_id=page.id,
            version_number=2,
            status="published",
            created_by_user_id=user_id,
            published_at=datetime.now(timezone.utc),
        )
        self.db.add(draft_revision)
        self.db.add(published_revision)
        self.db.flush()
        sections = validate_section_list(default_home_sections(payload))
        self._replace_revision_sections(draft_revision.id, sections)
        self._replace_revision_sections(published_revision.id, sections)
        page.current_draft_revision_id = draft_revision.id
        page.current_published_revision_id = published_revision.id
        config.published_revision_id = published_revision.id
        self._audit(organization.id, user_id, "onboarding_created", "website_page", page.id, {"page_slug": "home"})
        self.db.commit()
        return organization

    def _unique_organization_slug(self, base_slug: str) -> str:
        slug = base_slug or "firm"
        existing_slugs = set(
            self.db.execute(
                select(Organization.slug).where(
                    Organization.slug == slug,
                )
            ).scalars()
        )
        if not existing_slugs:
            return slug

        matching_slugs = set(
            self.db.execute(
                select(Organization.slug).where(Organization.slug.like(f"{slug}-%"))
            ).scalars()
        )
        suffix = 2
        while f"{slug}-{suffix}" in matching_slugs:
            suffix += 1
        return f"{slug}-{suffix}"

    def _unique_default_subdomain(self, base_slug: str, settings: Settings) -> str:
        slug = (base_slug or "firm")[:63].strip("-") or "firm"
        if slug in RESERVED_SUBDOMAINS or len(slug) < 3:
            slug = f"{slug}-site" if len(slug) >= 3 else "firm"

        if self._is_default_subdomain_available(slug, settings):
            return slug

        suffix = 2
        while not self._is_default_subdomain_available(f"{slug}-{suffix}", settings):
            suffix += 1
        return f"{slug}-{suffix}"

    def _is_default_subdomain_available(self, subdomain: str, settings: Settings) -> bool:
        existing_config = self.db.execute(
            select(WebsiteConfig.id).where(WebsiteConfig.default_subdomain == subdomain)
        ).scalar_one_or_none()
        if existing_config:
            return False
        hostname = build_platform_hostname(subdomain, settings)
        existing_domain = self.db.execute(select(Domain.id).where(Domain.hostname == hostname)).scalar_one_or_none()
        return existing_domain is None

    def _ensure_default_domain(self, organization: Organization, settings: Settings, default_subdomain: str | None = None) -> Domain | None:
        config = self.db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == organization.id)).scalar_one_or_none()
        subdomain = default_subdomain or (config.default_subdomain if config else None)
        if not subdomain:
            return None
        hostname = build_platform_hostname(subdomain, settings)
        if not hostname:
            return None
        domain = self.db.execute(select(Domain).where(Domain.hostname == hostname)).scalar_one_or_none()
        if domain:
            if domain.organization_id != organization.id:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Default domain is already assigned.")
            domain.organization_id = organization.id
            domain.domain_type = "platform"
            domain.is_verified = True
            domain.verification_status = "verified"
            domain.provisioning_status = "ready"
            if not domain.is_primary:
                domain.is_primary = True
            return domain
        domain = Domain(
            organization_id=organization.id,
            hostname=hostname,
            domain_type="platform",
            is_primary=True,
            is_verified=True,
            verification_status="verified",
            provisioning_status="ready",
        )
        self.db.add(domain)
        return domain

    def get_admin_page(self, tenant: TenantContext, page_slug: str) -> PublicSitePage:
        page, revision = self._get_page_and_revision(tenant.organization_id, page_slug, draft=True)
        return self._public_payload(page, revision, tenant.organization_slug)

    def update_draft(self, tenant: TenantContext, page_slug: str, sections: list[PageSection]) -> None:
        try:
            validated_sections = validate_section_list([section.model_dump(mode="json") for section in sections])
            assert_assets_belong_to_org(self.db, tenant.organization_id, validated_sections)
        except (ValidationError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        page, revision = self._get_page_and_revision(tenant.organization_id, page_slug, draft=True)
        if revision.status != "draft":
            version = self._next_version(page.id)
            revision = PageRevision(page_id=page.id, version_number=version, status="draft", created_by_user_id=tenant.user_id)
            self.db.add(revision)
            self.db.flush()
            page.current_draft_revision_id = revision.id
        self._replace_revision_sections(revision.id, validated_sections)
        self._audit(tenant.organization_id, tenant.user_id, "draft_updated", "page_revision", revision.id, {"page_slug": page_slug})
        self.db.commit()

    def legal_documents_for_organization(
        self,
        organization_id: str,
        *,
        include_drafts: bool = False,
    ) -> LegalDocuments:
        values: dict[str, dict[str, object]] = {}
        for field_name, (page_slug, _) in LEGAL_DOCUMENT_PAGES.items():
            page = self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.organization_id == organization_id,
                    WebsitePage.slug == page_slug,
                )
            ).scalar_one_or_none()
            enabled = bool(page and page.current_published_revision_id)
            revision_id = (
                page.current_draft_revision_id if include_drafts and page else page.current_published_revision_id if page else None
            )
            content = ""
            if revision_id:
                row = self.db.execute(
                    select(PageSectionModel)
                    .where(
                        PageSectionModel.revision_id == revision_id,
                        PageSectionModel.section_type == "rich_text",
                    )
                    .order_by(PageSectionModel.position.asc())
                ).scalars().first()
                if row:
                    content = str((row.content_json or {}).get("markdown", "")).strip()
            values[field_name] = {"enabled": enabled, "content": content}
        return LegalDocuments.model_validate(values)

    def update_legal_documents(self, tenant: TenantContext, documents: LegalDocuments) -> None:
        for field_name, (page_slug, title) in LEGAL_DOCUMENT_PAGES.items():
            document = getattr(documents, field_name)
            page = self.db.execute(
                select(WebsitePage).where(
                    WebsitePage.organization_id == tenant.organization_id,
                    WebsitePage.slug == page_slug,
                )
            ).scalar_one_or_none()
            if not page:
                page = WebsitePage(organization_id=tenant.organization_id, slug=page_slug, title=title)
                self.db.add(page)
                self.db.flush()

            draft = self.db.get(PageRevision, page.current_draft_revision_id) if page.current_draft_revision_id else None
            if not draft or draft.status != "draft":
                draft = PageRevision(
                    page_id=page.id,
                    version_number=self._next_version(page.id),
                    status="draft",
                    created_by_user_id=tenant.user_id,
                )
                self.db.add(draft)
                self.db.flush()
                page.current_draft_revision_id = draft.id

            sections = []
            if document.content:
                sections = validate_section_list(
                    [
                        {
                            "id": str(uuid4()),
                            "admin_label": title,
                            "section_type": "rich_text",
                            "position": 1,
                            "is_visible": True,
                            "variant": "article",
                            "content_json": {"heading": title, "markdown": document.content},
                        }
                    ]
                )
            self._replace_revision_sections(draft.id, sections)

            if page.current_published_revision_id:
                self.db.execute(
                    update(PageRevision)
                    .where(PageRevision.id == page.current_published_revision_id)
                    .values(status="archived")
                )
                page.current_published_revision_id = None

            if document.enabled:
                published = PageRevision(
                    page_id=page.id,
                    version_number=self._next_version(page.id),
                    status="published",
                    created_by_user_id=tenant.user_id,
                    published_at=datetime.now(timezone.utc),
                )
                self.db.add(published)
                self.db.flush()
                self._replace_revision_sections(published.id, sections)
                page.current_published_revision_id = published.id

        self._audit(
            tenant.organization_id,
            tenant.user_id,
            "legal_documents_updated",
            "organization",
            tenant.organization_id,
            {"documents": list(LEGAL_DOCUMENT_PAGES)},
        )

    def publish(self, tenant: TenantContext, page_slug: str, settings: Settings) -> PageRevision:
        page, draft = self._get_page_and_revision(tenant.organization_id, page_slug, draft=True)
        draft_sections = self._revision_sections(draft.id)
        try:
            validated_sections = validate_section_list(draft_sections)
            assert_assets_belong_to_org(self.db, tenant.organization_id, validated_sections)
        except (ValidationError, ValueError) as exc:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc)) from exc

        if page.current_published_revision_id:
            self.db.execute(
                update(PageRevision)
                .where(PageRevision.id == page.current_published_revision_id)
                .values(status="archived")
            )

        published = PageRevision(
            page_id=page.id,
            version_number=self._next_version(page.id),
            status="published",
            created_by_user_id=tenant.user_id,
            published_at=datetime.now(timezone.utc),
        )
        self.db.add(published)
        self.db.flush()
        self._replace_revision_sections(published.id, validated_sections)
        page.current_published_revision_id = published.id
        config = self.db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == tenant.organization_id)).scalar_one()
        config.published_revision_id = published.id
        self._audit(tenant.organization_id, tenant.user_id, "published", "page_revision", published.id, {"page_slug": page_slug})
        self.db.commit()
        self._notify_revalidation(settings, tenant.organization_id, [page_slug])
        return published

    def restore(self, tenant: TenantContext, page_slug: str, revision_id: str) -> PageRevision:
        page = self._page_for_tenant(tenant.organization_id, page_slug)
        revision = self.db.execute(
            select(PageRevision).where(PageRevision.page_id == page.id, PageRevision.id == revision_id)
        ).scalar_one_or_none()
        if not revision:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found.")
        restored = PageRevision(
            page_id=page.id,
            version_number=self._next_version(page.id),
            status="draft",
            created_by_user_id=tenant.user_id,
        )
        self.db.add(restored)
        self.db.flush()
        self._replace_revision_sections(restored.id, validate_section_list(self._revision_sections(revision.id)))
        page.current_draft_revision_id = restored.id
        self._audit(tenant.organization_id, tenant.user_id, "restored", "page_revision", restored.id, {"from_revision_id": revision_id})
        self.db.commit()
        return restored

    def public_by_slug(self, organization_slug: str, page_slug: str, settings: Settings) -> PublicSitePage:
        organization = self.db.execute(select(Organization).where(Organization.slug == organization_slug)).scalar_one_or_none()
        if not organization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
        public_base_url = self._primary_public_base_url(organization.id, settings)
        try:
            page, revision = self._get_page_and_revision(organization.id, page_slug, draft=False)
            return self._public_payload(page, revision, organization.slug, public_base_url)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_404_NOT_FOUND and page_slug in {"services", "about", "contact"}:
                home_page, home_revision = self._get_page_and_revision(organization.id, "home", draft=False)
                return self._derived_public_payload(home_page, home_revision, organization.slug, page_slug, public_base_url)
            if exc.status_code == status.HTTP_404_NOT_FOUND and page_slug in {"privacy-policy", "terms-of-service", "nda-confidentiality"}:
                home_page, home_revision = self._get_page_and_revision(organization.id, "home", draft=False)
                return self._legal_public_payload(home_page, home_revision, organization.slug, page_slug, public_base_url)
            raise

    def public_by_host(self, hostname: str, page_slug: str, settings: Settings, scheme: str = "https") -> PublicSitePage:
        normalized_hostname = normalize_hostname(hostname)
        domain = self.db.execute(
            select(Domain).where(
                Domain.hostname == normalized_hostname,
                Domain.is_verified.is_(True),
                Domain.provisioning_status == "ready",
            )
        ).scalar_one_or_none()
        organization_id = domain.organization_id if domain else self._organization_id_by_default_hostname(normalized_hostname, settings)
        if not organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Host is not mapped to a site.")
        organization = self.db.get(Organization, organization_id)
        if not organization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
        public_base_url = f"{scheme}://{normalized_hostname}"
        try:
            page, revision = self._get_page_and_revision(organization.id, page_slug, draft=False)
            return self._public_payload(page, revision, organization.slug, public_base_url)
        except HTTPException as exc:
            if exc.status_code == status.HTTP_404_NOT_FOUND and page_slug in {"services", "about", "contact"}:
                home_page, home_revision = self._get_page_and_revision(organization.id, "home", draft=False)
                return self._derived_public_payload(home_page, home_revision, organization.slug, page_slug, public_base_url)
            if exc.status_code == status.HTTP_404_NOT_FOUND and page_slug in {"privacy-policy", "terms-of-service", "nda-confidentiality"}:
                home_page, home_revision = self._get_page_and_revision(organization.id, "home", draft=False)
                return self._legal_public_payload(home_page, home_revision, organization.slug, page_slug, public_base_url)
            raise

    def _organization_id_by_default_hostname(self, hostname: str, settings: Settings) -> str | None:
        platform_domain = normalize_platform_domain(settings.platform_domain)
        suffix = f".{platform_domain}" if platform_domain else ""
        if not suffix or not hostname.endswith(suffix):
            return None
        subdomain = hostname[: -len(suffix)]
        if not subdomain or "." in subdomain:
            return None
        config = self.db.execute(
            select(WebsiteConfig).where(WebsiteConfig.default_subdomain == subdomain)
        ).scalar_one_or_none()
        return config.organization_id if config else None

    def _primary_public_base_url(self, organization_id: str, settings: Settings) -> str | None:
        primary_domain = self.db.execute(
            select(Domain).where(
                Domain.organization_id == organization_id,
                Domain.is_primary.is_(True),
                Domain.is_verified.is_(True),
                Domain.provisioning_status == "ready",
            )
        ).scalar_one_or_none()
        if primary_domain:
            scheme = settings.platform_scheme if primary_domain.domain_type == "platform" else "https"
            return f"{scheme.rstrip(':/')}://{primary_domain.hostname}"
        config = self.db.execute(
            select(WebsiteConfig).where(WebsiteConfig.organization_id == organization_id)
        ).scalar_one_or_none()
        return build_platform_url(config.default_subdomain if config else None, settings)

    def _page_for_tenant(self, organization_id: str, page_slug: str) -> WebsitePage:
        page = self.db.execute(
            select(WebsitePage).where(WebsitePage.organization_id == organization_id, WebsitePage.slug == page_slug)
        ).scalar_one_or_none()
        if not page:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Page not found.")
        return page

    def draft_page_slug_for_section(self, tenant: TenantContext, section_id: str) -> str:
        row = self.db.execute(
            select(WebsitePage.slug)
            .join(PageRevision, PageRevision.id == WebsitePage.current_draft_revision_id)
            .join(PageSectionModel, PageSectionModel.revision_id == PageRevision.id)
            .where(
                WebsitePage.organization_id == tenant.organization_id,
                PageSectionModel.id == section_id,
            )
        ).first()
        if not row:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Section not found.")
        return row[0]

    def _get_page_and_revision(self, organization_id: str, page_slug: str, draft: bool) -> tuple[WebsitePage, PageRevision]:
        page = self._page_for_tenant(organization_id, page_slug)
        revision_id = page.current_draft_revision_id if draft else page.current_published_revision_id
        if not revision_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found.")
        revision = self.db.get(PageRevision, revision_id)
        if not revision:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Revision not found.")
        return page, revision

    def _replace_revision_sections(self, revision_id: str, sections: list[PageSection]) -> None:
        self.db.query(PageSectionModel).filter(PageSectionModel.revision_id == revision_id).delete()
        for section in sorted(sections, key=lambda item: item.position):
            dumped = section.model_dump(mode="json")
            self.db.add(
                PageSectionModel(
                    revision_id=revision_id,
                    admin_label=dumped.get("admin_label"),
                    section_type=dumped["section_type"],
                    position=dumped["position"],
                    is_visible=dumped["is_visible"],
                    variant=dumped["variant"],
                    content_json=dumped["content_json"],
                )
            )

    def _revision_sections(self, revision_id: str) -> list[dict]:
        rows = self.db.execute(
            select(PageSectionModel).where(PageSectionModel.revision_id == revision_id).order_by(PageSectionModel.position.asc())
        ).scalars()
        return [
            {
                "id": row.id,
                "admin_label": row.admin_label,
                "section_type": row.section_type,
                "position": row.position,
                "is_visible": row.is_visible,
                "variant": row.variant,
                "content_json": row.content_json,
            }
            for row in rows
        ]

    def _public_payload(
        self,
        page: WebsitePage,
        revision: PageRevision,
        organization_slug: str,
        public_base_url: str | None = None,
    ) -> PublicSitePage:
        organization = self.db.get(Organization, page.organization_id)
        config = self.db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == page.organization_id)).scalar_one()
        sections = validate_section_list(self._revision_sections(revision.id))
        contact = self._contact_from_config(config)
        base_url = public_base_url or f"http://localhost:3000/s/{organization_slug}"
        canonical = base_url if page.slug == "home" else f"{base_url}/{page.slug}"
        firm_name = organization.name if organization else organization_slug
        city = organization.city if organization else ""
        founder_name = next(
            (
                section.content_json.founder_name
                for section in sections
                if section.section_type == "founder_profile" and section.is_visible
            ),
            None,
        )
        title, description = build_seo_copy(page.slug, page.title, firm_name, city, founder_name)
        return PublicSitePage(
            organization_id=page.organization_id,
            organization_slug=organization_slug,
            firm_name=firm_name,
            city=city,
            template_key=config.template_key,
            theme_key=config.theme_key,
            page_slug=page.slug,
            page_title=page.title,
            seo=SeoPayload(
                title=title,
                description=description,
                canonical_url=canonical,
            ),
            contact=contact,
            legal_documents=self.legal_documents_for_organization(
                page.organization_id,
                include_drafts=revision.status != "published",
            ),
            sections=[section for section in sections if section.is_visible] if revision.status == "published" else sections,
            published_at=revision.published_at or revision.created_at,
        )

    def _derived_public_payload(
        self,
        home_page: WebsitePage,
        home_revision: PageRevision,
        organization_slug: str,
        page_slug: str,
        public_base_url: str | None = None,
    ) -> PublicSitePage:
        payload = self._public_payload(home_page, home_revision, organization_slug, public_base_url)
        section_types_by_page = {
            "services": {"service_grid", "contact_form", "cta_banner"},
            "about": {"image_text", "contact_form"},
            "contact": {"contact_form"},
        }
        title_by_page = {
            "services": "Services",
            "about": "About",
            "contact": "Contact",
        }
        allowed_types = section_types_by_page[page_slug]
        base_url = public_base_url or f"http://localhost:3000/s/{organization_slug}"
        title = title_by_page[page_slug]
        seo_title, seo_description = build_seo_copy(page_slug, title, payload.firm_name, payload.city)
        return payload.model_copy(
            update={
                "page_slug": page_slug,
                "page_title": title,
                "seo": SeoPayload(
                    title=seo_title,
                    description=seo_description,
                    canonical_url=f"{base_url}/{page_slug}",
                ),
                "sections": [section for section in payload.sections if section.section_type in allowed_types],
            }
        )

    def _legal_public_payload(
        self,
        home_page: WebsitePage,
        home_revision: PageRevision,
        organization_slug: str,
        page_slug: str,
        public_base_url: str | None = None,
    ) -> PublicSitePage:
        payload = self._public_payload(home_page, home_revision, organization_slug, public_base_url)
        documents = {
            "privacy-policy": ("Privacy Policy", payload.legal_documents.privacy_policy),
            "terms-of-service": ("Terms of Service", payload.legal_documents.terms_of_service),
            "nda-confidentiality": ("NDA & Confidentiality Commitment", payload.legal_documents.nda_confidentiality),
        }
        title, document = documents[page_slug]
        if not document.enabled or not document.content:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Legal document not found.")
        base_url = public_base_url or f"http://localhost:3000/s/{organization_slug}"
        return payload.model_copy(
            update={
                "page_slug": page_slug,
                "page_title": title,
                "seo": SeoPayload(
                    title=f"{title} | {payload.firm_name}",
                    description=f"{title} for {payload.firm_name}.",
                    canonical_url=f"{base_url}/{page_slug}",
                ),
                "sections": [],
            }
        )

    def _contact_from_config(self, config: WebsiteConfig) -> ContactDetails:
        return ContactDetails(
            phone=config.contact_phone,
            whatsapp=config.contact_whatsapp,
            email=config.contact_email,
            address=config.contact_address,
        )

    def _next_version(self, page_id: str) -> int:
        latest = self.db.execute(select(func.max(PageRevision.version_number)).where(PageRevision.page_id == page_id)).scalar()
        return int(latest or 0) + 1

    def _audit(self, organization_id: str, actor_user_id: str | None, action: str, entity_type: str, entity_id: str, metadata: dict) -> None:
        self.db.add(
            AuditLog(
                organization_id=organization_id,
                actor_user_id=actor_user_id,
                action=action,
                entity_type=entity_type,
                entity_id=entity_id,
                metadata_json=metadata,
            )
        )

    def _notify_revalidation(self, settings: Settings, organization_id: str, page_slugs: list[str]) -> None:
        if not settings.next_revalidate_url or not settings.next_revalidate_secret:
            return
        organization = self.db.get(Organization, organization_id)
        config = self.db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == organization_id)).scalar_one_or_none()
        hostnames = set(
            self.db.execute(
                select(Domain.hostname).where(Domain.organization_id == organization_id, Domain.is_verified.is_(True))
            ).scalars()
        )
        if config and config.default_subdomain:
            hostnames.add(build_platform_hostname(config.default_subdomain, settings))
        try:
            httpx.post(
                str(settings.next_revalidate_url),
                headers={"authorization": f"Bearer {settings.next_revalidate_secret}"},
                json={
                    "organization_id": organization_id,
                    "organization_slug": organization.slug if organization else None,
                    "hostnames": sorted(host for host in hostnames if host),
                    "page_slugs": page_slugs,
                },
                timeout=5,
            )
        except httpx.HTTPError:
            pass
