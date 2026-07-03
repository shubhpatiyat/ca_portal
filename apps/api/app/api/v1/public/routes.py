from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.public import LeadCreate, LeadCreated, PublicSitePage
from app.services.lead_service import LeadService
from app.services.page_service import PageService

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/sites/by-slug/{organization_slug}/pages/{page_slug}", response_model=PublicSitePage)
def public_site_by_slug(organization_slug: str, page_slug: str, db: Session = Depends(get_db)) -> PublicSitePage:
    return PageService(db).public_by_slug(organization_slug, page_slug)


@router.get("/sites/by-host/pages/{page_slug}", response_model=PublicSitePage)
def public_site_by_host(
    request: Request,
    page_slug: str,
    hostname: str | None = Query(default=None),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> PublicSitePage:
    hostname = (
        hostname
        or request.headers.get("x-site-host")
        or request.headers.get("x-forwarded-host")
        or request.headers.get("host", "")
    )
    scheme = request.headers.get("x-forwarded-proto") or request.url.scheme or "https"
    return PageService(db).public_by_host(hostname, page_slug, settings, scheme)


@router.post("/leads", response_model=LeadCreated, status_code=201)
def create_lead(payload: LeadCreate, request: Request, db: Session = Depends(get_db)) -> LeadCreated:
    client_key = request.client.host if request.client else "unknown"
    lead = LeadService(db).create_public_lead(payload, client_key)
    return LeadCreated(id=lead.id, status=lead.status)
