from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, get_tenant_context, require_editor, require_owner
from app.auth.supabase import AuthenticatedUser
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import ClientCompany, CompanyDocument, DocumentUploadSession, FirmClient, Organization, WebsiteConfig
from app.schemas.admin import (
    ClientCompanyCreate,
    ClientCompanyOut,
    CompanyDocumentCreate,
    CompanyDocumentOut,
    ConfirmUploadRequest,
    CustomDomainCreate,
    CustomDomainOut,
    DocumentUploadSessionCreate,
    DocumentUploadSessionOut,
    DraftUpdate,
    FirmClientCreate,
    FirmClientOut,
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
from app.services.domain_service import DomainService
from app.services.client_portal_auth import hash_client_password
from app.services.lead_service import LeadService
from app.services.media_service import MediaService
from app.services.page_service import PageService, build_platform_url

router = APIRouter(prefix="/admin", tags=["admin"])


def _get_client(db: Session, tenant: TenantContext, client_id: str) -> FirmClient:
    client = db.execute(
        select(FirmClient).where(FirmClient.organization_id == tenant.organization_id, FirmClient.id == client_id)
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found.")
    return client


def _get_company(db: Session, tenant: TenantContext, company_id: str) -> ClientCompany:
    company = db.execute(
        select(ClientCompany).where(ClientCompany.organization_id == tenant.organization_id, ClientCompany.id == company_id)
    ).scalar_one_or_none()
    if not company:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company not found.")
    return company


def _get_document(db: Session, tenant: TenantContext, document_id: str) -> CompanyDocument:
    document = db.execute(
        select(CompanyDocument).where(CompanyDocument.organization_id == tenant.organization_id, CompanyDocument.id == document_id)
    ).scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    return document


def _client_out(client: FirmClient, company_count: int = 0, document_count: int = 0) -> FirmClientOut:
    return FirmClientOut(
        id=client.id,
        name=client.name,
        mobile=client.mobile,
        email=client.email,
        address=client.address,
        city=client.city,
        state=client.state,
        portal_enabled=client.portal_enabled,
        status=client.status,
        company_count=company_count,
        document_count=document_count,
        created_at=client.created_at,
    )


def _company_out(company: ClientCompany, client_name: str, document_count: int = 0) -> ClientCompanyOut:
    return ClientCompanyOut(
        id=company.id,
        client_id=company.client_id,
        client_name=client_name,
        company_name=company.company_name,
        company_type=company.company_type,
        registered_address=company.registered_address,
        registration_number=company.registration_number,
        registered_email=company.registered_email,
        pan=company.pan,
        gst=company.gst,
        other_id_type=company.other_id_type,
        other_id_value=company.other_id_value,
        portal_visible=company.portal_visible,
        can_upload=company.can_upload,
        can_download=company.can_download,
        can_view_billing=company.can_view_billing,
        can_view_tally=company.can_view_tally,
        document_count=document_count,
        created_at=company.created_at,
    )


def _document_out(document: CompanyDocument, client_name: str, company_name: str) -> CompanyDocumentOut:
    return CompanyDocumentOut(
        id=document.id,
        client_id=document.client_id,
        client_name=client_name,
        company_id=document.company_id,
        company_name=company_name,
        financial_year=document.financial_year,
        month=document.month,
        document_type=document.document_type,
        document_name=document.document_name,
        status=document.status,
        visible_to_client=document.visible_to_client,
        allow_client_upload=document.allow_client_upload,
        allow_client_download=document.allow_client_download,
        storage_provider=document.storage_provider,
        storage_path=document.storage_path,
        web_url=document.web_url,
        size_bytes=document.size_bytes,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def organization_out(
    db: Session,
    tenant: TenantContext,
    settings: Settings,
    organization: Organization | None = None,
) -> OrganizationOut:
    organization = organization or db.get(Organization, tenant.organization_id)
    config = db.execute(select(WebsiteConfig).where(WebsiteConfig.organization_id == tenant.organization_id)).scalar_one_or_none()
    default_subdomain = config.default_subdomain if config else None
    default_url = DomainService(db, settings).primary_url(tenant.organization_id) or build_platform_url(default_subdomain, settings)
    return OrganizationOut(
        id=tenant.organization_id,
        name=organization.name if organization else tenant.organization_slug,
        slug=tenant.organization_slug,
        city=organization.city if organization else "",
        role=tenant.role,
        template_key=config.template_key if config else "modern_ca",
        theme_key=config.theme_key if config else "navy_gold",
        default_subdomain=default_subdomain,
        default_url=default_url,
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


@router.get("/clients", response_model=list[FirmClientOut])
def clients(tenant: TenantContext = Depends(get_tenant_context), db: Session = Depends(get_db)) -> list[FirmClientOut]:
    rows = db.execute(
        select(
            FirmClient,
            func.count(func.distinct(ClientCompany.id)).label("company_count"),
            func.count(func.distinct(CompanyDocument.id)).label("document_count"),
        )
        .outerjoin(ClientCompany, ClientCompany.client_id == FirmClient.id)
        .outerjoin(CompanyDocument, CompanyDocument.client_id == FirmClient.id)
        .where(FirmClient.organization_id == tenant.organization_id)
        .group_by(FirmClient.id)
        .order_by(FirmClient.created_at.desc())
    ).all()
    return [_client_out(client, company_count, document_count) for client, company_count, document_count in rows]


@router.post("/clients", response_model=FirmClientOut, status_code=201)
def create_client(
    payload: FirmClientCreate,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
) -> FirmClientOut:
    data = payload.model_dump()
    data["email"] = str(data["email"]).lower()
    generated_password = "12345678"
    client = FirmClient(
        organization_id=tenant.organization_id,
        password_hash=hash_client_password(generated_password),
        password_generated_at=datetime.now().astimezone(),
        must_reset_password=True,
        **data,
    )
    db.add(client)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A client with this mobile number already exists.") from exc
    db.refresh(client)
    out = _client_out(client)
    out.generated_password = generated_password
    return out


@router.get("/companies", response_model=list[ClientCompanyOut])
def companies(
    client_id: str | None = Query(default=None),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> list[ClientCompanyOut]:
    query = (
        select(ClientCompany, FirmClient.name, func.count(CompanyDocument.id).label("document_count"))
        .join(FirmClient, FirmClient.id == ClientCompany.client_id)
        .outerjoin(CompanyDocument, CompanyDocument.company_id == ClientCompany.id)
        .where(ClientCompany.organization_id == tenant.organization_id)
        .group_by(ClientCompany.id, FirmClient.name)
        .order_by(ClientCompany.created_at.desc())
    )
    if client_id:
        query = query.where(ClientCompany.client_id == client_id)
    rows = db.execute(query).all()
    return [_company_out(company, client_name, document_count) for company, client_name, document_count in rows]


@router.post("/companies", response_model=ClientCompanyOut, status_code=201)
def create_company(
    payload: ClientCompanyCreate,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
) -> ClientCompanyOut:
    client = _get_client(db, tenant, payload.client_id)
    data = payload.model_dump()
    company = ClientCompany(organization_id=tenant.organization_id, **data)
    db.add(company)
    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This company already exists for the selected client.") from exc
    db.refresh(company)
    return _company_out(company, client.name)


@router.get("/documents", response_model=list[CompanyDocumentOut])
def documents(
    client_id: str | None = Query(default=None),
    company_id: str | None = Query(default=None),
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
) -> list[CompanyDocumentOut]:
    query = (
        select(CompanyDocument, FirmClient.name, ClientCompany.company_name)
        .join(FirmClient, FirmClient.id == CompanyDocument.client_id)
        .join(ClientCompany, ClientCompany.id == CompanyDocument.company_id)
        .where(CompanyDocument.organization_id == tenant.organization_id)
        .order_by(CompanyDocument.created_at.desc())
    )
    if client_id:
        query = query.where(CompanyDocument.client_id == client_id)
    if company_id:
        query = query.where(CompanyDocument.company_id == company_id)
    rows = db.execute(query).all()
    return [_document_out(document, client_name, company_name) for document, client_name, company_name in rows]


@router.post("/documents", response_model=CompanyDocumentOut, status_code=201)
def create_document(
    payload: CompanyDocumentCreate,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
) -> CompanyDocumentOut:
    company = _get_company(db, tenant, payload.company_id)
    client = _get_client(db, tenant, company.client_id)
    data = payload.model_dump()
    document = CompanyDocument(organization_id=tenant.organization_id, client_id=company.client_id, **data)
    db.add(document)
    db.commit()
    db.refresh(document)
    return _document_out(document, client.name, company.company_name)


@router.post("/document-upload-sessions", response_model=DocumentUploadSessionOut, status_code=201)
def create_document_upload_session(
    payload: DocumentUploadSessionCreate,
    tenant: TenantContext = Depends(require_editor),
    db: Session = Depends(get_db),
) -> DocumentUploadSessionOut:
    document = _get_document(db, tenant, payload.document_id)
    session = DocumentUploadSession(
        organization_id=tenant.organization_id,
        document_id=document.id,
        uploaded_by_kind="admin",
        uploaded_by_user_id=tenant.user_id,
        file_name=payload.file_name,
        file_size=payload.file_size,
        status=payload.status,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return DocumentUploadSessionOut(
        id=session.id,
        document_id=session.document_id,
        uploaded_by_kind=session.uploaded_by_kind,
        file_name=session.file_name,
        file_size=session.file_size,
        uploaded_bytes=session.uploaded_bytes,
        status=session.status,
        provider_file_id=session.provider_file_id,
        error_message=session.error_message,
        retry_count=session.retry_count,
        started_at=session.started_at,
        completed_at=session.completed_at,
        failed_at=session.failed_at,
    )


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


@router.get("/domains", response_model=list[CustomDomainOut])
def domains(
    tenant: TenantContext = Depends(get_tenant_context),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> list[CustomDomainOut]:
    return DomainService(db, settings).list_domains(tenant)


@router.post("/domains", response_model=CustomDomainOut, status_code=201)
def add_domain(
    payload: CustomDomainCreate,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> CustomDomainOut:
    return DomainService(db, settings).create_custom_domain(tenant, payload)


@router.post("/domains/{domain_id}/verify", response_model=CustomDomainOut)
def verify_domain(
    domain_id: str,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> CustomDomainOut:
    return DomainService(db, settings).verify_custom_domain(tenant, domain_id)


@router.post("/domains/{domain_id}/primary", response_model=CustomDomainOut)
def make_domain_primary(
    domain_id: str,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> CustomDomainOut:
    return DomainService(db, settings).make_primary(tenant, domain_id)


@router.delete("/domains/{domain_id}", status_code=204)
def delete_domain(
    domain_id: str,
    tenant: TenantContext = Depends(require_owner),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> None:
    DomainService(db, settings).delete_custom_domain(tenant, domain_id)


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
