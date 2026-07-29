from app.models import (
    AnalyticsEvent,
    AuditLog,
    Domain,
    Lead,
    MediaAsset,
    OrganizationMember,
    PageRevision,
    PageSection,
    WebsiteConfig,
    WebsitePage,
)


def _ondelete_for(model: type, column_name: str) -> str | None:
    foreign_keys = list(model.__table__.columns[column_name].foreign_keys)
    assert len(foreign_keys) == 1
    return foreign_keys[0].ondelete


def test_organization_owned_rows_cascade_on_delete() -> None:
    assert _ondelete_for(OrganizationMember, "organization_id") == "CASCADE"
    assert _ondelete_for(WebsiteConfig, "organization_id") == "CASCADE"
    assert _ondelete_for(Domain, "organization_id") == "CASCADE"
    assert _ondelete_for(WebsitePage, "organization_id") == "CASCADE"
    assert _ondelete_for(MediaAsset, "organization_id") == "CASCADE"
    assert _ondelete_for(Lead, "organization_id") == "CASCADE"
    assert _ondelete_for(AnalyticsEvent, "organization_id") == "CASCADE"
    assert _ondelete_for(AuditLog, "organization_id") == "CASCADE"


def test_page_children_cascade_on_delete() -> None:
    assert _ondelete_for(PageRevision, "page_id") == "CASCADE"
    assert _ondelete_for(PageSection, "revision_id") == "CASCADE"
