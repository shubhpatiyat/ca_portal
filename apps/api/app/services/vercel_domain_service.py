from dataclasses import dataclass
from typing import Any
from urllib.parse import quote

import httpx

from app.core.config import Settings


class VercelDomainError(RuntimeError):
    def __init__(self, message: str, status_code: int | None = None) -> None:
        super().__init__(message)
        self.status_code = status_code


@dataclass(frozen=True)
class VercelDomainState:
    verified: bool
    misconfigured: bool
    dns_record_type: str | None
    dns_record_value: str | None
    verification_record_name: str | None
    verification_record_value: str | None

    @property
    def status(self) -> str:
        if not self.verified:
            return "pending_provider_verification"
        if self.misconfigured:
            return "pending_dns"
        return "ready"


class VercelDomainService:
    api_url = "https://api.vercel.com"

    def __init__(self, settings: Settings, client: httpx.Client | None = None) -> None:
        self.settings = settings
        self.client = client

    @property
    def is_configured(self) -> bool:
        return bool(self.settings.vercel_api_token and self.settings.vercel_project_id)

    def provision(self, hostname: str) -> VercelDomainState:
        self._require_configuration()
        project_domain = self._get_project_domain(hostname)
        if project_domain is None:
            project_domain = self._request(
                "POST",
                f"/v10/projects/{quote(self.settings.vercel_project_id or '', safe='')}/domains",
                json={"name": hostname},
            )

        if not bool(project_domain.get("verified")):
            try:
                project_domain = self._request(
                    "POST",
                    f"/v9/projects/{quote(self.settings.vercel_project_id or '', safe='')}/domains/{quote(hostname, safe='')}/verify",
                )
            except VercelDomainError as exc:
                if exc.status_code not in {400, 409}:
                    raise
                project_domain = self._get_project_domain(hostname) or project_domain

        configuration = self._request(
            "GET",
            f"/v6/domains/{quote(hostname, safe='')}/config",
            params={"projectIdOrName": self.settings.vercel_project_id or ""},
        )
        record_type, record_value = self._recommended_dns(configuration)
        verification_name, verification_value = self._verification_record(project_domain)
        return VercelDomainState(
            verified=bool(project_domain.get("verified")),
            misconfigured=bool(configuration.get("misconfigured", True)),
            dns_record_type=record_type,
            dns_record_value=record_value,
            verification_record_name=verification_name,
            verification_record_value=verification_value,
        )

    def remove(self, hostname: str) -> None:
        self._require_configuration()
        try:
            self._request(
                "DELETE",
                f"/v9/projects/{quote(self.settings.vercel_project_id or '', safe='')}/domains/{quote(hostname, safe='')}",
            )
        except VercelDomainError as exc:
            if exc.status_code != 404:
                raise

    def _get_project_domain(self, hostname: str) -> dict[str, Any] | None:
        try:
            return self._request(
                "GET",
                f"/v9/projects/{quote(self.settings.vercel_project_id or '', safe='')}/domains/{quote(hostname, safe='')}",
            )
        except VercelDomainError as exc:
            if exc.status_code == 404:
                return None
            raise

    def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, str] | None = None,
        json: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        query = dict(params or {})
        if self.settings.vercel_team_id:
            query["teamId"] = self.settings.vercel_team_id
        headers = {
            "authorization": f"Bearer {self.settings.vercel_api_token}",
            "content-type": "application/json",
        }
        try:
            if self.client:
                response = self.client.request(method, f"{self.api_url}{path}", params=query, json=json, headers=headers)
            else:
                with httpx.Client(timeout=10.0) as client:
                    response = client.request(method, f"{self.api_url}{path}", params=query, json=json, headers=headers)
        except httpx.HTTPError as exc:
            raise VercelDomainError("Could not reach Vercel. Try verification again shortly.") from exc

        if response.is_success:
            if response.status_code == 204 or not response.content:
                return {}
            return response.json()

        message = "Vercel could not provision this domain."
        try:
            body = response.json()
            error = body.get("error", {}) if isinstance(body, dict) else {}
            message = error.get("message") or message
        except ValueError:
            pass
        raise VercelDomainError(message, response.status_code)

    def _require_configuration(self) -> None:
        if not self.is_configured:
            raise VercelDomainError("Vercel domain provisioning is not configured for this deployment.")

    @staticmethod
    def _verification_record(project_domain: dict[str, Any]) -> tuple[str | None, str | None]:
        challenges = project_domain.get("verification") or []
        for challenge in challenges:
            if challenge.get("type") == "TXT":
                return challenge.get("domain"), challenge.get("value")
        return None, None

    @staticmethod
    def _recommended_dns(configuration: dict[str, Any]) -> tuple[str | None, str | None]:
        cnames = sorted(configuration.get("recommendedCNAME") or [], key=lambda item: item.get("rank", 999))
        if cnames and cnames[0].get("value"):
            return "CNAME", cnames[0]["value"]

        ipv4_records = sorted(configuration.get("recommendedIPv4") or [], key=lambda item: item.get("rank", 999))
        if ipv4_records:
            values = ipv4_records[0].get("value") or []
            if isinstance(values, str):
                return "A", values
            if values:
                return "A", values[0]
        return None, None
