from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, StringConstraints
from typing_extensions import Annotated

from app.schemas.sections import PageSection


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
    default_subdomain: str | None = None
    default_url: str | None = None


class MeOut(BaseModel):
    id: str
    email: EmailStr | str
    organization: OrganizationOut


class OrganizationUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=160)] | None = None
    city: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=100)] | None = None


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
