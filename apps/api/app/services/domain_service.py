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
        else:
            domain.is_verified = False
            domain.verification_status = "pending"

        self.db.commit()
        self.db.refresh(domain)
        return _domain_out(domain)

    def make_primary(self, tenant: TenantContext, domain_id: str) -> CustomDomainOut:
        domain = self._custom_domain_for_tenant(tenant, domain_id)
        if not domain.is_verified:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Verify this domain before making it primary.")
        self.db.execute(update(Domain).where(Domain.organization_id == tenant.organization_id).values(is_primary=False))
        domain.is_primary = True
        self.db.commit()
        self.db.refresh(domain)
        return _domain_out(domain)

    def delete_custom_domain(self, tenant: TenantContext, domain_id: str) -> None:
        domain = self._custom_domain_for_tenant(tenant, domain_id)
        self.db.delete(domain)
        self.db.commit()

    def primary_url(self, organization_id: str) -> str | None:
        domain = self.db.execute(
            select(Domain).where(
                Domain.organization_id == organization_id,
                Domain.is_primary.is_(True),
                Domain.is_verified.is_(True),
            )
        ).scalar_one_or_none()
        if not domain:
            return None
        return f"https://{domain.hostname}"

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
