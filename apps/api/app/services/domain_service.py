from datetime import datetime, timezone
from secrets import token_urlsafe
from urllib.parse import urlsplit

from fastapi import HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import Domain
from app.schemas.admin import CustomDomainCreate, CustomDomainOut, TenantContext
from app.services.page_service import normalize_platform_domain
from app.services.vercel_domain_service import VercelDomainError, VercelDomainService


def normalize_custom_hostname(value: str) -> str:
    hostname = value.strip().lower()
    if "://" in hostname:
        hostname = urlsplit(hostname).netloc
    hostname = hostname.split("/")[0].split("?")[0].split("#")[0].strip(".")
    if ":" in hostname:
        hostname = hostname.split(":")[0]
    return hostname


def _verification_record(hostname: str, settings: Settings, token: str) -> tuple[str, str]:
    prefix = settings.custom_domain_txt_prefix.strip(".") or "_ca-site"
    return f"{prefix}.{hostname}", f"ca-site-verification={token}"


def _domain_out(domain: Domain) -> CustomDomainOut:
    return CustomDomainOut(
        id=domain.id,
        hostname=domain.hostname,
        domain_type=domain.domain_type,
        is_primary=domain.is_primary,
        is_verified=domain.is_verified,
        verification_status=domain.verification_status,
        verification_record_name=domain.verification_record_name,
        verification_record_value=domain.verification_record_value,
        dns_target=domain.dns_target,
        dns_record_type=domain.dns_record_type,
        provisioning_status=domain.provisioning_status,
        is_ready=domain.provisioning_status == "ready",
        provider_verification_record_name=domain.provider_verification_record_name,
        provider_verification_record_value=domain.provider_verification_record_value,
        provider_error=domain.provider_error,
        provider_checked_at=domain.provider_checked_at,
        verified_at=domain.verified_at,
        last_checked_at=domain.last_checked_at,
        created_at=domain.created_at,
    )


class DomainService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def list_domains(self, tenant: TenantContext) -> list[CustomDomainOut]:
        domains = self.db.execute(
            select(Domain)
            .where(Domain.organization_id == tenant.organization_id)
            .order_by(Domain.is_primary.desc(), Domain.domain_type.asc(), Domain.created_at.desc())
        ).scalars()
        return [_domain_out(domain) for domain in domains]

    def create_custom_domain(self, tenant: TenantContext, payload: CustomDomainCreate) -> CustomDomainOut:
        hostname = normalize_custom_hostname(payload.hostname)
        self._validate_custom_hostname(hostname)
        existing = self.db.execute(select(Domain).where(Domain.hostname == hostname)).scalar_one_or_none()
        if existing:
            if existing.organization_id == tenant.organization_id:
                return _domain_out(existing)
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This domain is already attached to another website.")

        token = token_urlsafe(32)
        record_name, record_value = _verification_record(hostname, self.settings, token)
        domain = Domain(
            organization_id=tenant.organization_id,
            hostname=hostname,
            domain_type="custom",
            is_primary=False,
            is_verified=False,
            verification_status="pending",
            verification_token=token,
            verification_record_name=record_name,
            verification_record_value=record_value,
            dns_target=self.settings.custom_domain_cname_target,
            dns_record_type="CNAME",
            provisioning_status="pending_ownership",
        )
        self.db.add(domain)
        self.db.commit()
        self.db.refresh(domain)
        return _domain_out(domain)

    def verify_custom_domain(self, tenant: TenantContext, domain_id: str) -> CustomDomainOut:
        domain = self._custom_domain_for_tenant(tenant, domain_id)
        now = datetime.now(timezone.utc)
        domain.last_checked_at = now

        if self._txt_record_contains(domain.verification_record_name, domain.verification_record_value):
            domain.is_verified = True
            domain.verification_status = "verified"
            domain.verified_at = now
            domain.provisioning_status = "provisioning"
            domain.provider_error = None
            self._provision_with_vercel(domain, now)
        else:
            domain.is_verified = False
            domain.verification_status = "pending"
            domain.provisioning_status = "pending_ownership"
            domain.provider_error = None

        self.db.commit()
        self.db.refresh(domain)
        return _domain_out(domain)

    def make_primary(self, tenant: TenantContext, domain_id: str) -> CustomDomainOut:
        domain = self._custom_domain_for_tenant(tenant, domain_id)
        if domain.provisioning_status != "ready":
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The domain must be live before making it primary.")
        self.db.execute(update(Domain).where(Domain.organization_id == tenant.organization_id).values(is_primary=False))
        domain.is_primary = True
        self.db.commit()
        self.db.refresh(domain)
        return _domain_out(domain)

    def delete_custom_domain(self, tenant: TenantContext, domain_id: str) -> None:
        domain = self._custom_domain_for_tenant(tenant, domain_id)
        provider = VercelDomainService(self.settings)
        if provider.is_configured and domain.provisioning_status != "pending_ownership":
            try:
                provider.remove(domain.hostname)
            except VercelDomainError as exc:
                raise HTTPException(
                    status_code=status.HTTP_502_BAD_GATEWAY,
                    detail=f"Could not remove the domain from Vercel: {exc}",
                ) from exc
        self.db.delete(domain)
        self.db.commit()

    def primary_url(self, organization_id: str) -> str | None:
        domain = self.db.execute(
            select(Domain).where(
                Domain.organization_id == organization_id,
                Domain.is_primary.is_(True),
                Domain.is_verified.is_(True),
                Domain.provisioning_status == "ready",
            )
        ).scalar_one_or_none()
        if not domain:
            return None
        return f"https://{domain.hostname}"

    def _provision_with_vercel(self, domain: Domain, checked_at: datetime) -> None:
        provider = VercelDomainService(self.settings)
        domain.provider_checked_at = checked_at
        if not provider.is_configured:
            domain.provisioning_status = "configuration_required"
            domain.provider_error = "Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID to the API deployment."
            return

        try:
            provider_state = provider.provision(domain.hostname)
        except VercelDomainError as exc:
            domain.provisioning_status = "failed"
            domain.provider_error = str(exc)
            return

        domain.provisioning_status = provider_state.status
        domain.provider_error = None
        domain.provider_verification_record_name = provider_state.verification_record_name
        domain.provider_verification_record_value = provider_state.verification_record_value
        if provider_state.dns_record_type:
            domain.dns_record_type = provider_state.dns_record_type
        if provider_state.dns_record_value:
            domain.dns_target = provider_state.dns_record_value

    def _custom_domain_for_tenant(self, tenant: TenantContext, domain_id: str) -> Domain:
        domain = self.db.execute(
            select(Domain).where(
                Domain.organization_id == tenant.organization_id,
                Domain.id == domain_id,
                Domain.domain_type == "custom",
            )
        ).scalar_one_or_none()
        if not domain:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Custom domain not found.")
        return domain

    def _validate_custom_hostname(self, hostname: str) -> None:
        if not hostname or "." not in hostname or hostname.startswith("*."):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid custom domain.")
        platform_domain = normalize_platform_domain(self.settings.platform_domain)
        if platform_domain and hostname.endswith(f".{platform_domain}"):
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Use the built-in domain instead.")

    def _txt_record_contains(self, record_name: str | None, expected_value: str | None) -> bool:
        if not record_name or not expected_value:
            return False
        try:
            import dns.resolver
        except ImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="DNS verification dependency is not installed.",
            ) from exc

        try:
            answers = dns.resolver.resolve(record_name, "TXT", lifetime=6)
        except Exception:
            return False
        values = []
        for answer in answers:
            values.append("".join(part.decode("utf-8") for part in answer.strings))
        return expected_value in values
