from app.schemas.public import PublicSitePage
from app.schemas.admin import CompanyDocumentCreate


def test_public_delivery_contract_has_no_admin_fields() -> None:
    fields = set(PublicSitePage.model_fields)
    assert "audit_logs" not in fields
    assert "current_draft_revision_id" not in fields
    assert "members" not in fields
    assert {"sections", "seo", "contact", "published_at"}.issubset(fields)


def test_company_document_defaults_to_app_storage() -> None:
    payload = CompanyDocumentCreate(
        company_id="company-1",
        financial_year="2025-26",
        document_type="Bank Statement",
        document_name="Bank Statement July",
    )

    assert payload.storage_provider == "app"
