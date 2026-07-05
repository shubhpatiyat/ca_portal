import pytest
from pydantic import TypeAdapter, ValidationError

from app.schemas.sections import PageSection
from app.services.page_service import build_whatsapp_url, validate_section_list

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


def test_section_positions_must_be_unique() -> None:
    sections = [
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
        },
        {
            "id": "cta",
            "section_type": "cta_banner",
            "position": 1,
            "is_visible": True,
            "variant": "solid",
            "content_json": {
                "heading": "Ready to start?",
                "description": "Book a consultation with the firm.",
                "primary_cta": {"label": "Contact", "href": "#contact"},
            },
        },
    ]

    with pytest.raises(ValueError, match="positions must be unique"):
        validate_section_list(sections)


def test_whatsapp_numbers_are_normalized_to_links() -> None:
    assert build_whatsapp_url("+91 90000 12345") == "https://wa.me/919000012345"
    assert build_whatsapp_url("https://wa.me/919876543210") == "https://wa.me/919876543210"
