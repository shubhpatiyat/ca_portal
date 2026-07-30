from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing_extensions import Annotated

from app.schemas.sections import PageSection
from app.schemas.public import LegalDocuments


Role = Literal["owner", "editor", "viewer"]


class TenantContext(BaseModel):
    user_id: str
    organization_id: str
    organization_slug: str
    role: Role


class OrganizationOut(BaseModel):
    id: str
    name: str
    slug: str
    city: str
    role: Role
    template_key: Literal["modern_ca", "traditional_ca", "premium_ca"] = "modern_ca"
    theme_key: Literal["navy_gold", "emerald_cream", "charcoal_blue"] = "navy_gold"
    default_subdomain: str | None = None
    default_url: str | None = None
    legal_documents: LegalDocuments = Field(default_factory=LegalDocuments)


class MeOut(BaseModel):
    id: str
    email: EmailStr | str
    organization: OrganizationOut


class OrganizationUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)] | None = None
    city: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)] | None = None
    theme_key: Literal["navy_gold", "emerald_cream", "charcoal_blue"] | None = None
    contact_phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=24)] | None = None
    contact_whatsapp: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=120)] | None = None
    contact_email: EmailStr | None = None
    contact_address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=240)] | None = None
    legal_documents: LegalDocuments | None = None


class CustomDomainCreate(BaseModel):
    hostname: Annotated[str, StringConstraints(strip_whitespace=True, min_length=4, max_length=255)]


class CustomDomainOut(BaseModel):
    id: str
    hostname: str
    domain_type: Literal["platform", "custom"]
    is_primary: bool
    is_verified: bool
    verification_status: Literal["pending", "verified", "failed"]
    verification_record_name: str | None = None
    verification_record_value: str | None = None
    dns_target: str | None = None
    dns_record_type: Literal["A", "CNAME"] | None = None
    provisioning_status: Literal[
        "pending_ownership",
        "provisioning",
        "pending_provider_verification",
        "pending_dns",
        "ready",
        "configuration_required",
        "failed",
    ]
    is_ready: bool
    provider_verification_record_name: str | None = None
    provider_verification_record_value: str | None = None
    provider_error: str | None = None
    provider_checked_at: datetime | None = None
    verified_at: datetime | None = None
    last_checked_at: datetime | None = None
    created_at: datetime


class DraftUpdate(BaseModel):
    sections: list[PageSection]


class ReorderRequest(BaseModel):
    section_ids: list[str] = Field(min_length=1)


class PublishOut(BaseModel):
    published_revision_id: str
    published_at: datetime


class OnboardingRequest(BaseModel):
    firmName: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    founderName: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    city: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
    address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=240)]
    phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=24)]
    whatsapp: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=24)]
    email: EmailStr
    services: list[str] = Field(min_length=1, max_length=12)
    templateKey: Literal["modern_ca", "traditional_ca", "premium_ca"]
    themeKey: Literal["navy_gold", "emerald_cream", "charcoal_blue"]


class SignupLinkRequest(BaseModel):
    email: EmailStr
    password: Annotated[str, StringConstraints(min_length=8, max_length=128)]
    redirect_to: str


class SignupLinkOut(BaseModel):
    action_link: str


class OnboardingOut(BaseModel):
    organization_slug: str
    default_subdomain: str | None = None
    default_url: str | None = None
    preview_url: str


class LeadOut(BaseModel):
    id: str
    name: str
    phone: str
    email: str | None = None
    service_interest: str | None = None
    message: str | None = None
    source_page_slug: str
    status: Literal["new", "contacted", "closed"]
    created_at: datetime


class LeadUpdate(BaseModel):
    status: Literal["new", "contacted", "closed"]


class AnalyticsMetricOut(BaseModel):
    value: float
    previous: float
    change_percent: float | None = None


class AnalyticsSummaryOut(BaseModel):
    period_days: Literal[7, 30, 90]
    visitors: AnalyticsMetricOut
    page_views: AnalyticsMetricOut
    new_enquiries: AnalyticsMetricOut
    conversion_rate: AnalyticsMetricOut
    phone_clicks: AnalyticsMetricOut
    whatsapp_clicks: AnalyticsMetricOut
    email_clicks: AnalyticsMetricOut
    client_logins: AnalyticsMetricOut


class PresignUploadRequest(BaseModel):
    purpose: Literal["logos", "heroes", "founders", "testimonials"]
    file_name: str
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    size_bytes: int = Field(gt=0, le=5 * 1024 * 1024)


class PresignUploadOut(BaseModel):
    storage_path: str
    upload_url: str
    public_url: str


class ConfirmUploadRequest(BaseModel):
    storage_path: str
    public_url: str
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    file_name: str
    size_bytes: int = Field(gt=0, le=5 * 1024 * 1024)
    width: int | None = None
    height: int | None = None


CompanyType = Literal["Individual", "HUF", "Partnership", "LLP", "Company", "AOP", "BOI", "OJP"]
ClientStatus = Literal["active", "inactive", "blocked"]
DocumentStatus = Literal["requested", "uploading", "uploaded", "under_review", "approved", "rejected", "shared"]
UploadSessionStatus = Literal["pending", "uploading", "processing", "completed", "failed", "cancelled", "expired"]


class FirmClientCreate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=140)]
    mobile: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=32)]
    email: EmailStr
    address: Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)] | None = None
    city: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None
    state: Annotated[str, StringConstraints(strip_whitespace=True, max_length=100)] | None = None
    portal_enabled: bool = False


class FirmClientOut(BaseModel):
    id: str
    name: str
    mobile: str
    email: str | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    portal_enabled: bool
    status: ClientStatus
    company_count: int = 0
    document_count: int = 0
    generated_password: str | None = None
    created_at: datetime


class ClientCompanyCreate(BaseModel):
    client_id: str
    company_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=180)]
    company_type: CompanyType
    registered_address: Annotated[str, StringConstraints(strip_whitespace=True, max_length=300)] | None = None
    registration_number: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None
    registered_email: EmailStr | None = None
    pan: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    gst: Annotated[str, StringConstraints(strip_whitespace=True, max_length=30)] | None = None
    other_id_type: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None
    other_id_value: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None
    portal_visible: bool = True
    can_upload: bool = True
    can_download: bool = True
    can_view_billing: bool = False
    can_view_tally: bool = False


class ClientCompanyOut(BaseModel):
    id: str
    client_id: str
    client_name: str
    company_name: str
    company_type: CompanyType
    registered_address: str | None = None
    registration_number: str | None = None
    registered_email: str | None = None
    pan: str | None = None
    gst: str | None = None
    other_id_type: str | None = None
    other_id_value: str | None = None
    portal_visible: bool
    can_upload: bool
    can_download: bool
    can_view_billing: bool
    can_view_tally: bool
    document_count: int = 0
    created_at: datetime


class CompanyDocumentCreate(BaseModel):
    company_id: str
    financial_year: Annotated[str, StringConstraints(strip_whitespace=True, min_length=4, max_length=16)]
    month: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20)] | None = None
    document_type: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=80)]
    document_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=180)]
    status: DocumentStatus = "requested"
    visible_to_client: bool = False
    allow_client_upload: bool = True
    allow_client_download: bool = False
    storage_provider: Literal["app", "onedrive", "manual"] = "app"
    storage_path: Annotated[str, StringConstraints(strip_whitespace=True, max_length=700)] | None = None
    web_url: Annotated[str, StringConstraints(strip_whitespace=True, max_length=900)] | None = None


class CompanyDocumentOut(BaseModel):
    id: str
    client_id: str
    client_name: str
    company_id: str
    company_name: str
    financial_year: str
    month: str | None = None
    document_type: str
    document_name: str
    status: DocumentStatus
    visible_to_client: bool
    allow_client_upload: bool
    allow_client_download: bool
    storage_provider: str
    storage_path: str | None = None
    web_url: str | None = None
    size_bytes: int | None = None
    created_at: datetime
    updated_at: datetime


class DocumentUploadSessionCreate(BaseModel):
    document_id: str
    file_name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    file_size: int = Field(gt=0)
    status: UploadSessionStatus = "pending"


class DocumentUploadSessionOut(BaseModel):
    id: str
    document_id: str
    uploaded_by_kind: Literal["admin", "client"]
    file_name: str
    file_size: int
    uploaded_bytes: int
    status: UploadSessionStatus
    provider_file_id: str | None = None
    error_message: str | None = None
    retry_count: int
    started_at: datetime
    completed_at: datetime | None = None
    failed_at: datetime | None = None
