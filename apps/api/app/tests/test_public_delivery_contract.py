from app.schemas.public import PublicSitePage


def test_public_delivery_contract_has_no_admin_fields() -> None:
    fields = set(PublicSitePage.model_fields)
    assert "audit_logs" not in fields
    assert "current_draft_revision_id" not in fields
    assert "members" not in fields
    assert {"sections", "seo", "contact", "published_at"}.issubset(fields)
