import os
from datetime import datetime, timezone

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings
from app.models import Domain, Lead, Organization, OrganizationMember, PageRevision, PageSection, WebsiteConfig, WebsitePage
from app.schemas.admin import OnboardingRequest
from app.services.default_content import default_home_sections
from app.services.page_service import build_platform_hostname, build_whatsapp_url, validate_section_list

DEMO_ORGANIZATION_SLUG = "sample-ca-firm"
DEMO_FIRM_NAME = "Sample CA Firm"


def seed() -> None:
    settings = get_settings()
    owner_user_id = os.getenv("SEED_OWNER_USER_ID", "00000000-0000-4000-8000-000000000001")
    engine = create_engine(settings.database_url, pool_pre_ping=True)
    session = sessionmaker(bind=engine)()
    organization = session.execute(select(Organization).where(Organization.slug == DEMO_ORGANIZATION_SLUG)).scalar_one_or_none()
    if not organization:
        organization = Organization(name=DEMO_FIRM_NAME, slug=DEMO_ORGANIZATION_SLUG, city="Your City", status="active")
        session.add(organization)
        session.flush()
    if not session.execute(select(OrganizationMember).where(OrganizationMember.organization_id == organization.id)).first():
        session.add(OrganizationMember(organization_id=organization.id, user_id=owner_user_id, role="owner"))
    if not session.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == organization.id)).scalar_one_or_none():
        session.add(
            WebsiteConfig(
                organization_id=organization.id,
                template_key="modern_ca",
                theme_key="navy_gold",
                default_subdomain=DEMO_ORGANIZATION_SLUG,
                contact_phone="+91 90000 12345",
                contact_whatsapp=build_whatsapp_url("+91 90000 12345"),
                contact_email="office@example.com",
                contact_address="Your office address",
            )
        )
    default_hostname = build_platform_hostname(DEMO_ORGANIZATION_SLUG, settings)
    if default_hostname and not session.execute(select(Domain).where(Domain.hostname == default_hostname)).scalar_one_or_none():
        session.add(
            Domain(
                organization_id=organization.id,
                hostname=default_hostname,
                domain_type="platform",
                is_primary=True,
                is_verified=True,
                verification_status="verified",
                provisioning_status="ready",
            )
        )

    page = session.execute(select(WebsitePage).where(WebsitePage.organization_id == organization.id, WebsitePage.slug == "home")).scalar_one_or_none()
    if not page:
        page = WebsitePage(organization_id=organization.id, slug="home", title="Home")
        session.add(page)
        session.flush()

    if not page.current_published_revision_id:
        payload = OnboardingRequest(
            firmName=DEMO_FIRM_NAME,
            founderName="CA Founder Name",
            city="Your City",
            address="Your office address",
            phone="+91 90000 12345",
            whatsapp="+91 90000 12345",
            email="office@example.com",
            services=[
                "Income Tax Filing",
                "GST Registration & Returns",
                "Accounting & Bookkeeping",
                "TDS & Payroll Compliance",
                "Audit & Financial Reporting",
            ],
            templateKey="modern_ca",
            themeKey="navy_gold",
        )
        revision = PageRevision(
            page_id=page.id,
            version_number=1,
            status="published",
            created_by_user_id=owner_user_id,
            published_at=datetime.now(timezone.utc),
        )
        session.add(revision)
        session.flush()
        for section in validate_section_list(default_home_sections(payload)):
            data = section.model_dump(mode="json")
            session.add(
                PageSection(
                    revision_id=revision.id,
                    section_type=data["section_type"],
                    position=data["position"],
                    is_visible=data["is_visible"],
                    variant=data["variant"],
                    content_json=data["content_json"],
                )
            )
        page.current_published_revision_id = revision.id
        page.current_draft_revision_id = revision.id

    if not session.execute(select(Lead).where(Lead.organization_id == organization.id)).first():
        session.add_all(
            [
                Lead(
                    organization_id=organization.id,
                    name="Sample Client",
                    phone="+91 98765 43210",
                    email="client@example.com",
                    service_interest="GST Registration & Returns",
                    message="Need help correcting last quarter's returns.",
                    source_page_slug="home",
                    status="new",
                ),
                Lead(
                    organization_id=organization.id,
                    name="Priya Nair",
                    phone="+91 91234 56789",
                    service_interest="Accounting & Bookkeeping",
                    source_page_slug="contact",
                    status="contacted",
                ),
            ]
        )
    session.commit()
    session.close()


if __name__ == "__main__":
    seed()
