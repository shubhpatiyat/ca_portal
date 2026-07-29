from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from pydantic import BaseModel, EmailStr, StringConstraints
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import ClientCompany, CompanyDocument, DocumentUploadSession, FirmClient, Organization
from app.services.analytics_service import AnalyticsService
from app.services.client_portal_auth import (
    ClientPortalSession,
    create_client_token,
    organization_for_host,
    verify_client_password,
    verify_client_token,
)

router = APIRouter(prefix="/client", tags=["client"])


class ClientLoginRequest(BaseModel):
    hostname: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=255)]
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=1, max_length=128)]


class ClientLoginOut(BaseModel):
    access_token: str
    client: "ClientMeOut"


class ClientMeOut(BaseModel):
    id: str
    name: str
    email: str
    mobile: str
    portal_enabled: bool
    must_reset_password: bool
    firm_name: str
    firm_slug: str


class ClientCompanyPortalOut(BaseModel):
    id: str
    company_name: str
    company_type: str
    pan: str | None = None
    gst: str | None = None
    can_upload: bool
    can_download: bool
    can_view_billing: bool
    can_view_tally: bool
    document_count: int = 0


class ClientDocumentPortalOut(BaseModel):
    id: str
    company_id: str
    company_name: str
    financial_year: str
    month: str | None = None
    document_type: str
    document_name: str
    status: str
    allow_client_upload: bool
    allow_client_download: bool
    web_url: str | None = None
    updated_at: str


class ClientDocumentUploadRequest(BaseModel):
    file_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    file_size: int
    mime_type: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None


class ClientDocumentUploadOut(BaseModel):
    document: ClientDocumentPortalOut


def _bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client login is required.")
    return authorization.removeprefix("Bearer ").strip()


def get_client_session(
    token: str = Depends(_bearer_token),
    settings: Settings = Depends(get_settings),
) -> ClientPortalSession:
    return verify_client_token(token, settings)


def get_client(
    session: ClientPortalSession = Depends(get_client_session),
    db: Session = Depends(get_db),
) -> FirmClient:
    client = db.execute(
        select(FirmClient).where(
            FirmClient.id == session.client_id,
            FirmClient.organization_id == session.organization_id,
            FirmClient.portal_enabled.is_(True),
            FirmClient.status == "active",
        )
    ).scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client login is required.")
    return client


def _client_me(client: FirmClient, firm_name: str, firm_slug: str) -> ClientMeOut:
    return ClientMeOut(
        id=client.id,
        name=client.name,
        email=client.email or "",
        mobile=client.mobile,
        portal_enabled=client.portal_enabled,
        must_reset_password=client.must_reset_password,
        firm_name=firm_name,
        firm_slug=firm_slug,
    )


@router.post("/auth/login", response_model=ClientLoginOut)
def login_client(
    payload: ClientLoginRequest,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> ClientLoginOut:
    organization = organization_for_host(db, payload.hostname)
    client = db.execute(
        select(FirmClient).where(
            FirmClient.organization_id == organization.id,
            FirmClient.email == str(payload.email).lower(),
            FirmClient.portal_enabled.is_(True),
            FirmClient.status == "active",
        )
    ).scalar_one_or_none()
    if not client or not verify_client_password(payload.password, client.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password for this firm.")
    client.last_login_at = datetime.now(timezone.utc)
    AnalyticsService(db).record_client_login(organization.id)
    db.commit()
    return ClientLoginOut(
        access_token=create_client_token(client, settings),
        client=_client_me(client, organization.name, organization.slug),
    )


@router.get("/me", response_model=ClientMeOut)
def me(client: FirmClient = Depends(get_client), db: Session = Depends(get_db)) -> ClientMeOut:
    organization = db.get(Organization, client.organization_id)
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm not found.")
    return _client_me(client, organization.name, organization.slug)


@router.get("/dashboard")
def dashboard(
    client: FirmClient = Depends(get_client),
    db: Session = Depends(get_db),
) -> dict[str, object]:
    companies = db.execute(
        select(ClientCompany).where(
            ClientCompany.organization_id == client.organization_id,
            ClientCompany.client_id == client.id,
            ClientCompany.portal_visible.is_(True),
        ).order_by(ClientCompany.created_at.desc())
    ).scalars().all()
    documents = db.execute(
        select(CompanyDocument, ClientCompany.company_name)
        .join(ClientCompany, ClientCompany.id == CompanyDocument.company_id)
        .where(
            CompanyDocument.organization_id == client.organization_id,
            CompanyDocument.client_id == client.id,
            CompanyDocument.visible_to_client.is_(True),
        )
        .order_by(CompanyDocument.updated_at.desc())
    ).all()
    document_counts = {}
    for document, _company_name in documents:
        document_counts[document.company_id] = document_counts.get(document.company_id, 0) + 1
    return {
        "client": {
            "id": client.id,
            "name": client.name,
            "email": client.email,
            "mobile": client.mobile,
            "must_reset_password": client.must_reset_password,
        },
        "companies": [
            ClientCompanyPortalOut(
                id=company.id,
                company_name=company.company_name,
                company_type=company.company_type,
                pan=company.pan,
                gst=company.gst,
                can_upload=company.can_upload,
                can_download=company.can_download,
                can_view_billing=company.can_view_billing,
                can_view_tally=company.can_view_tally,
                document_count=document_counts.get(company.id, 0),
            ).model_dump()
            for company in companies
        ],
        "documents": [
            ClientDocumentPortalOut(
                id=document.id,
                company_id=document.company_id,
                company_name=company_name,
                financial_year=document.financial_year,
                month=document.month,
                document_type=document.document_type,
                document_name=document.document_name,
                status=document.status,
                allow_client_upload=document.allow_client_upload,
                allow_client_download=document.allow_client_download,
                web_url=document.web_url if document.allow_client_download else None,
                updated_at=document.updated_at.isoformat(),
            ).model_dump()
            for document, company_name in documents
        ],
    }


@router.post("/documents/{document_id}/upload", response_model=ClientDocumentUploadOut)
def upload_document(
    document_id: str,
    payload: ClientDocumentUploadRequest,
    client: FirmClient = Depends(get_client),
    db: Session = Depends(get_db),
) -> ClientDocumentUploadOut:
    if payload.file_size <= 0:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="File size must be greater than zero.")

    row = db.execute(
        select(CompanyDocument, ClientCompany)
        .join(ClientCompany, ClientCompany.id == CompanyDocument.company_id)
        .where(
            CompanyDocument.id == document_id,
            CompanyDocument.organization_id == client.organization_id,
            CompanyDocument.client_id == client.id,
            CompanyDocument.visible_to_client.is_(True),
            CompanyDocument.allow_client_upload.is_(True),
            ClientCompany.portal_visible.is_(True),
            ClientCompany.can_upload.is_(True),
        )
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Upload request not found.")

    document, company = row
    if document.status not in {"requested", "uploading", "rejected"}:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This document request is not accepting uploads.")

    document.status = "uploaded"
    document.storage_provider = "app"
    document.storage_path = f"client-uploads/{client.id}/{document.id}/{payload.file_name}"
    document.web_url = None
    document.mime_type = payload.mime_type
    document.size_bytes = payload.file_size
    session = DocumentUploadSession(
        organization_id=client.organization_id,
        document_id=document.id,
        uploaded_by_kind="client",
        uploaded_by_user_id=client.id,
        file_name=payload.file_name,
        file_size=payload.file_size,
        uploaded_bytes=payload.file_size,
        status="completed",
        completed_at=datetime.now(timezone.utc),
    )
    db.add(session)
    db.commit()
    db.refresh(document)

    return ClientDocumentUploadOut(
        document=ClientDocumentPortalOut(
            id=document.id,
            company_id=document.company_id,
            company_name=company.company_name,
            financial_year=document.financial_year,
            month=document.month,
            document_type=document.document_type,
            document_name=document.document_name,
            status=document.status,
            allow_client_upload=document.allow_client_upload,
            allow_client_download=document.allow_client_download,
            web_url=document.web_url if document.allow_client_download else None,
            updated_at=document.updated_at.isoformat(),
        )
    )
