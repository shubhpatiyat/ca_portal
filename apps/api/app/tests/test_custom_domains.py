import pytest
from fastapi import HTTPException

from app.core.config import Settings
from app.services.domain_service import DomainService, normalize_custom_hostname


def test_custom_hostname_normalization_accepts_plain_domains_and_urls() -> None:
    assert normalize_custom_hostname("HTTPS://WWW.ExampleFirm.COM:443/contact?x=1") == "www.examplefirm.com"
    assert normalize_custom_hostname("tax.examplefirm.com.") == "tax.examplefirm.com"


def test_custom_domain_rejects_platform_domain() -> None:
    settings = Settings(platform_domain="sites.example.com")
    service = DomainService(db=None, settings=settings)  # type: ignore[arg-type]

    with pytest.raises(HTTPException, match="Use the built-in domain"):
        service._validate_custom_hostname("firm.sites.example.com")
