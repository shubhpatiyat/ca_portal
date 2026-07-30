from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints, model_validator
from typing_extensions import Annotated

from app.schemas.sections import PageSection


class ContactDetails(BaseModel):
    phone: str
    whatsapp: str
    email: EmailStr
    address: str


class SeoPayload(BaseModel):
    title: str
    description: str
    canonical_url: str


class LegalDocument(BaseModel):
    enabled: bool = False
    content: Annotated[str, StringConstraints(strip_whitespace=True, max_length=20000)] = ""

    @model_validator(mode="after")
    def enabled_document_has_content(self) -> "LegalDocument":
        if self.enabled and len(self.content) < 20:
            raise ValueError("Enabled legal documents must contain at least 20 characters.")
        return self


class LegalDocuments(BaseModel):
    privacy_policy: LegalDocument = Field(default_factory=LegalDocument)
    terms_of_service: LegalDocument = Field(default_factory=LegalDocument)
    nda_confidentiality: LegalDocument = Field(default_factory=LegalDocument)


class PublicSitePage(BaseModel):
    organization_id: str
    organization_slug: str
    firm_name: str
    city: str
    template_key: Literal["modern_ca", "traditional_ca", "premium_ca"]
    theme_key: Literal["navy_gold", "emerald_cream", "charcoal_blue"]
    page_slug: str
    page_title: str
    seo: SeoPayload
    contact: ContactDetails
    legal_documents: LegalDocuments = Field(default_factory=LegalDocuments)
    sections: list[PageSection]
    published_at: datetime


class LeadCreate(BaseModel):
    organization_slug: str | None = None
    hostname: str | None = None
    source_page_slug: str = "home"
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    business_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None
    city: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] | None = None
    phone: Annotated[str, StringConstraints(strip_whitespace=True, min_length=8, max_length=24)]
    email: EmailStr | None = None
    inquiry_type: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None
    service_interest: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None
    message: Annotated[str, StringConstraints(strip_whitespace=True, max_length=1000)] | None = None
    website: str | None = Field(default=None, max_length=0)


class LeadCreated(BaseModel):
    id: str
    status: str


class AnalyticsEventCreate(BaseModel):
    organization_slug: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=140)]
    event_type: Literal["page_view", "phone_click", "whatsapp_click", "email_click"]
    page_slug: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=80)]
    hostname: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
    session_id: Annotated[str, StringConstraints(strip_whitespace=True, min_length=16, max_length=80)]
