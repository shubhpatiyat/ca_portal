from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_tenant_context, require_editor, require_owner
from app.auth.supabase import AuthenticatedUser
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import Organization, WebsiteConfig
from app.schemas.admin import (
    ConfirmUploadRequest,
    DraftUpdate,
    LeadOut,
    LeadUpdate,
    MeOut,
    OrganizationOut,
    OrganizationUpdate,
    PresignUploadOut,
    PresignUploadRequest,
    PublishOut,
    TenantContext,
)
from app.schemas.public import PublicSitePage
from app.services.lead_service import LeadService
from app.services.media_service import MediaService
from app.services.page_service import PageService, build_platform_url

router = APIRouter(prefix="/admin", tags=["admin"])


def organization_out(
    db: Session,
    tenant: TenantContext,
    settings: Settings,
    organization: Organization | None = None,
) -> OrganizationOut:
    organization = organization or db.get(Organization, tenant.organization_id)
    config = db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == tenant.organization_id)).scalar_one_or_none()
    default_subdomain = config.default_subdomain if config else None
    return OrganizationOut(
        id=tenant.organization_id,
        name=organization.name if organization else tenant.organization_slug,
        slug=tenant.organization_slug,
        city=organization.city if organization else "",
        role=tenant.role,
        template_key=config.template_key if config else "modern_ca",
        theme_key=config.theme_key if config else "navy_gold",
        default_subdomain=default_subdomain,
        default_url=build_platform_url(default_subdomain, settings),
    )


@router.get("/me", response_model=MeOut)
def me(
    user: AuthenticatedUser = Depends(get_current_user),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MeOut:
    organization = db.get(Organization, tenant.organization_id)
    return MeOut(
        id=user.user_id,
        email=user.email or user.user_id,
        organization=organization_out(db, tenant, settings, organization),
    )


@router.get("/organization", response_model=OrganizationOut)
def get_organization(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> OrganizationOut:
    organization = db.get(Organization, tenant.organization_id)
    return organization_out(db, tenant, settings, organization)


@router.patch("/organization", response_model=OrganizationOut)
def update_organization(
    payload: OrganizationUpdate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> OrganizationOut:
    organization = db.get(Organization, tenant.organization_id)
    if payload.name is not None:
        organization.name = payload.name
    if payload.city is not None:
        organization.city = payload.city
    if payload.theme_key is not None:
        config = db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == tenant.organization_id)).scalar_one()
        config.theme_key = payload.theme_key
    db.commit()
    PageService(db)._notify_revalidation(settings, tenant.organization_id, ["home", "services", "about", "contact"])
    return organization_out(db, tenant, settings, organization)


@router.get("/pages/{page_slug}", response_model=PublicSitePage)
def get_page(page_slug: str, tenant: TenantContext = Depends(get_tenant_context), db: Session = Depends(get_db)) -> PublicSitePage:
    return PageService(db).get_admin_page(tenant, page_slug)


@router.patch("/pages/{page_slug}/draft", status_code=204)
def update_draft(payload: DraftUpdate, page_slug: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> None:
    PageService(db).update_draft(tenant, page_slug, payload.sections)


@router.post("/pages/{page_slug}/sections", status_code=204)
def add_section(payload: DraftUpdate, page_slug: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> None:
    PageService(db).update_draft(tenant, page_slug, payload.sections)


@router.patch("/sections/{section_id}", status_code=204)
def update_section(section_id: str, payload: DraftUpdate, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> None:
    service = PageService(db)
    page_slug = service.draft_page_slug_for_section(tenant, section_id)
    service.update_draft(tenant, page_slug, payload.sections)


@router.delete("/sections/{section_id}", status_code=204)
def delete_section(section_id: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> None:
    service = PageService(db)
    page_slug = service.draft_page_slug_for_section(tenant, section_id)
    page = service.get_admin_page(tenant, page_slug)
    remaining = [section for section in page.sections if section.id != section_id]
    service.update_draft(tenant, page_slug, remaining)


@router.post("/pages/{page_slug}/reorder", status_code=204)
def reorder_page(payload: DraftUpdate, page_slug: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> None:
    PageService(db).update_draft(tenant, page_slug, payload.sections)


@router.post("/pages/{page_slug}/preview", response_model=PublicSitePage)
def preview_page(page_slug: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> PublicSitePage:
    return PageService(db).get_admin_page(tenant, page_slug)


@router.post("/pages/{page_slug}/publish", response_model=PublishOut)
def publish_page(
    page_slug: str,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> PublishOut:
    revision = PageService(db).publish(tenant, page_slug, settings)
    return PublishOut(published_revision_id=revision.id, published_at=revision.published_at)


@router.get("/pages/{page_slug}/revisions")
def revisions(page_slug: str, tenant: TenantContext = Depends(get_tenant_context), db: Session = Depends(get_db)) -> list[dict]:
    from app.models import PageRevision, WebsitePage

    page = db.execute(select(WebsitePage).where(WebsitePage.organization_id == tenant.organization_id, WebsitePage.slug == page_slug)).scalar_one()
    rows = db.execute(select(PageRevision).where(PageRevision.page_id == page.id).order_by(PageRevision.version_number.desc())).scalars()
    return [{"id": row.id, "version_number": row.version_number, "status": row.status, "published_at": row.published_at} for row in rows]


@router.post("/pages/{page_slug}/restore/{revision_id}", status_code=204)
def restore_revision(page_slug: str, revision_id: str, tenant: TenantContext = Depends(require_owner), db: Session = Depends(get_db)) -> None:
    PageService(db).restore(tenant, page_slug, revision_id)


@router.get("/leads", response_model=list[LeadOut])
def leads(
    status: str | None = Query(default=None),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> list[LeadOut]:
    return LeadService(db).list_admin_leads(tenant, status)


@router.patch("/leads/{lead_id}", response_model=LeadOut)
def update_lead(lead_id: str, payload: LeadUpdate, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db)) -> LeadOut:
    return LeadService(db).update_admin_lead(tenant, lead_id, payload)


@router.post("/media/presign-upload", response_model=PresignUploadOut)
def presign_upload(
    payload: PresignUploadRequest,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> PresignUploadOut:
    return MediaService(db, settings).presign_upload(tenant, payload)


@router.post("/media/confirm-upload")
def confirm_upload(
    payload: ConfirmUploadRequest,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> dict[str, str]:
    asset = MediaService(db, settings).confirm_upload(tenant, payload)
    return {"id": asset.id, "public_url": asset.public_url}


@router.get("/media")
def media(tenant: TenantContext = Depends(get_tenant_context), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)) -> list[dict]:
    assets = MediaService(db, settings).list_assets(tenant)
    return [{"id": asset.id, "public_url": asset.public_url, "file_name": asset.file_name, "mime_type": asset.mime_type} for asset in assets]


@router.delete("/media/{media_id}", status_code=204)
def delete_media(media_id: str, tenant: TenantContext = Depends(require_editor), db: Session = Depends(get_db), settings: Settings = Depends(get_settings)) -> None:
    MediaService(db, settings).delete_asset(tenant, media_id)
