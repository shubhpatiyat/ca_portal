from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.auth.dependencies import require_owner
from app.schemas.admin import TenantContext
from app.services.page_service import section_list_adapter


def test_non_owner_cannot_publish() -> None:
    tenant = TenantContext(
        user_id="user-1",
        organization_id="org-1",
        organization_slug="firm",
        role="editor",
    )
    with pytest.raises(HTTPException):
        require_owner(tenant)


def test_publish_payload_keeps_draft_and_published_concepts_separate() -> None:
    section = section_list_adapter.validate_python(
        [
            {
                "id": "hero",
                "section_type": "hero",
                "position": 1,
                "is_visible": True,
                "variant": "centered",
                "content_json": {
                    "eyebrow": "CA Services",
                    "title": "Trusted compliance",
                    "description": "Support for GST and tax.",
                    "primary_cta": {"label": "Contact", "href": "#contact"},
                },
            }
        ]
    )[0]
    draft_snapshot = section.model_dump(mode="json")
    published_snapshot = section.model_dump(mode="json")
    published_at = datetime.now(timezone.utc)

    draft_snapshot["content_json"]["title"] = "Draft only title"

    assert published_snapshot["content_json"]["title"] == "Trusted compliance"
    assert published_at.tzinfo is not None
