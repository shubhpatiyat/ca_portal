import json

import httpx
import pytest

from app.core.config import Settings
from app.services.vercel_domain_service import VercelDomainError, VercelDomainService


def test_provision_adds_domain_and_uses_recommended_cname() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET" and request.url.path.endswith("/domains/www.firm.com"):
            return httpx.Response(404, json={"error": {"message": "not found"}})
        if request.method == "POST" and request.url.path.endswith("/domains"):
            assert json.loads(request.content) == {"name": "www.firm.com"}
            return httpx.Response(200, json={"name": "www.firm.com", "verified": True})
        if request.method == "GET" and request.url.path.endswith("/config"):
            return httpx.Response(
                200,
                json={
                    "misconfigured": False,
                    "recommendedCNAME": [{"rank": 1, "value": "cname.vercel-dns-017.com"}],
                    "recommendedIPv4": [],
                },
            )
        raise AssertionError(f"Unexpected Vercel request: {request.method} {request.url}")

    settings = Settings(vercel_api_token="token", vercel_project_id="project", vercel_team_id="team")
    client = httpx.Client(transport=httpx.MockTransport(handler))
    state = VercelDomainService(settings, client).provision("www.firm.com")

    assert state.status == "ready"
    assert state.dns_record_type == "CNAME"
    assert state.dns_record_value == "cname.vercel-dns-017.com"


def test_provision_returns_provider_verification_challenge() -> None:
    project_domain = {
        "name": "www.firm.com",
        "verified": False,
        "verification": [{"type": "TXT", "domain": "_vercel.firm.com", "value": "vc-domain-verify=token"}],
    }

    def handler(request: httpx.Request) -> httpx.Response:
        if request.method == "GET" and request.url.path.endswith("/domains/www.firm.com"):
            return httpx.Response(200, json=project_domain)
        if request.method == "POST" and request.url.path.endswith("/verify"):
            return httpx.Response(400, json={"error": {"message": "verification pending"}})
        if request.method == "GET" and request.url.path.endswith("/config"):
            return httpx.Response(
                200,
                json={
                    "misconfigured": True,
                    "recommendedCNAME": [{"rank": 1, "value": "cname.vercel-dns-017.com"}],
                    "recommendedIPv4": [],
                },
            )
        raise AssertionError(f"Unexpected Vercel request: {request.method} {request.url}")

    settings = Settings(vercel_api_token="token", vercel_project_id="project")
    client = httpx.Client(transport=httpx.MockTransport(handler))
    state = VercelDomainService(settings, client).provision("www.firm.com")

    assert state.status == "pending_provider_verification"
    assert state.verification_record_name == "_vercel.firm.com"
    assert state.verification_record_value == "vc-domain-verify=token"


def test_provision_requires_vercel_credentials() -> None:
    with pytest.raises(VercelDomainError, match="not configured"):
        VercelDomainService(Settings()).provision("www.firm.com")
