import pytest
from pydantic import TypeAdapter, ValidationError

from app.schemas.sections import PageSection

adapter = TypeAdapter(PageSection)


def test_cta_url_rejects_unsafe_protocol() -> None:
    with pytest.raises(ValidationError):
        adapter.validate_python(
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
                    "primary_cta": {"label": "Click", "href": "javascript:alert(1)"},
                },
            }
        )


def test_rich_text_disallows_raw_html() -> None:
    with pytest.raises(ValidationError):
        adapter.validate_python(
            {
                "id": "rich",
                "section_type": "rich_text",
                "position": 1,
                "is_visible": True,
                "variant": "article",
                "content_json": {"heading": "Article", "markdown": "<script>alert(1)</script>"},
            }
        )
