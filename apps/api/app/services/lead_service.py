from time import monotonic

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Lead, Organization
from app.schemas.admin import LeadUpdate, TenantContext
from app.schemas.public import LeadCreate


class InMemoryRateLimit:
    def __init__(self) -> None:
        self._hits: dict[str, list[float]] = {}

    def check(self, key: str, limit: int = 8, window_seconds: int = 300) -> None:
        now = monotonic()
        hits = [value for value in self._hits.get(key, []) if now - value < window_seconds]
        if len(hits) >= limit:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Please try again in a few minutes.")
        hits.append(now)
        self._hits[key] = hits


rate_limit = InMemoryRateLimit()


class LeadService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def create_public_lead(self, payload: LeadCreate, client_key: str) -> Lead:
        rate_limit.check(client_key)
        if payload.website:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid form submission.")
        organization = self.db.execute(select(Organization).where(Organization.slug == payload.organization_slug)).scalar_one_or_none()
        if not organization:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Site not found.")
        detail_lines = [
            f"Business Name: {payload.business_name}" if payload.business_name else None,
            f"City: {payload.city}" if payload.city else None,
            f"Looking For: {payload.inquiry_type}" if payload.inquiry_type else None,
            payload.message,
        ]
        message = "\n".join(line for line in detail_lines if line)
        lead = Lead(
            organization_id=organization.id,
            name=payload.name,
            phone=payload.phone,
            email=str(payload.email) if payload.email else None,
            service_interest=payload.inquiry_type or payload.service_interest,
            message=message or None,
            source_page_slug=payload.source_page_slug,
            status="new",
        )
        self.db.add(lead)
        self.db.commit()
        self.db.refresh(lead)
        return lead

    def list_admin_leads(self, tenant: TenantContext, status_filter: str | None = None) -> list[Lead]:
        statement = select(Lead).where(Lead.organization_id == tenant.organization_id).order_by(Lead.created_at.desc())
        if status_filter:
            statement = statement.where(Lead.status == status_filter)
        return list(self.db.execute(statement).scalars())

    def update_admin_lead(self, tenant: TenantContext, lead_id: str, payload: LeadUpdate) -> Lead:
        lead = self.db.execute(
            select(Lead).where(Lead.organization_id == tenant.organization_id, Lead.id == lead_id)
        ).scalar_one_or_none()
        if not lead:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lead not found.")
        lead.status = payload.status
        self.db.commit()
        self.db.refresh(lead)
        return lead
