from app.core.config import Settings
from app.services.page_service import (
    build_platform_hostname,
    build_platform_url,
    normalize_hostname,
    normalize_platform_display_domain,
    normalize_platform_domain,
)


def test_normalize_hostname_strips_scheme_port_and_case() -> None:
    assert normalize_hostname("HTTP://Sahiba-House.LVH.ME:3000") == "sahiba-house.lvh.me"
    assert normalize_hostname("sahiba-house.lvh.me:3000") == "sahiba-house.lvh.me"


def test_build_platform_domain_uses_configured_root() -> None:
    settings = Settings(platform_domain="app.chat.localhost:8080", platform_scheme="http")

    assert normalize_platform_domain(settings.platform_domain) == "app.chat.localhost"
    assert normalize_platform_display_domain(settings.platform_domain) == "app.chat.localhost:8080"
    assert build_platform_hostname("sahiba-house", settings) == "sahiba-house.app.chat.localhost"
    assert build_platform_url("sahiba-house", settings) == "http://sahiba-house.app.chat.localhost:8080"
