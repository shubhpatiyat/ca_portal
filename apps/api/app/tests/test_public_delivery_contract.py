import pytest
from pydantic import ValidationError

from app.schemas.public import LegalDocument, PublicSitePage
from app.schemas.admin import CompanyDocumentCreate
from app.services.page_service import build_seo_copy


def test_public_delivery_contract_has_no_admin_fields() -> None:
    fields = set(PublicSitePage.model_fields)
    assert "audit_logs" not in fields
    assert "current_draft_revision_id" not in fields
    assert "members" not in fields
    assert {"sections", "seo", "contact", "legal_documents", "published_at"}.issubset(fields)


def test_enabled_legal_document_requires_meaningful_text() -> None:
    with pytest.raises(ValidationError, match="at least 20 characters"):
        LegalDocument(enabled=True, content="Too short")

    document = LegalDocument(enabled=True, content="This is a complete legal document introduction.")
    assert document.enabled is True


def test_company_document_defaults_to_app_storage() -> None:
    payload = CompanyDocumentCreate(
        company_id="company-1",
        financial_year="2025-26",
        document_type="Bank Statement",
        document_name="Bank Statement July",
    )

    assert payload.storage_provider == "app"


def test_home_seo_copy_uses_founder_and_location() -> None:
    title, description = build_seo_copy(
        "home",
        "Home",
        "Mehta and Associates",
        "Banswara",
        "Bhavin Mehta",
    )

    assert title == "Bhavin Mehta, Chartered Accountant in Banswara | Mehta and Associates"
    assert "GST" in description
    assert "Banswara" in description


def test_derived_page_seo_copy_has_distinct_search_intent() -> None:
    services_title, _ = build_seo_copy("services", "Services", "Mehta and Associates", "Banswara")
    contact_title, contact_description = build_seo_copy("contact", "Contact", "Mehta and Associates", "Banswara")

    assert services_title == "CA Services in Banswara | Mehta and Associates"
    assert contact_title != services_title
    assert "Banswara" in contact_description
