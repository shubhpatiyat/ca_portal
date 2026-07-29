import hashlib
from datetime import datetime, timedelta, timezone

from sqlalchemy import distinct, func, select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import AnalyticsEvent, Domain, Lead, Organization
from app.schemas.admin import AnalyticsMetricOut, AnalyticsSummaryOut, TenantContext
from app.schemas.public import AnalyticsEventCreate
from app.services.page_service import normalize_hostname

BOT_MARKERS = ("bot", "spider", "crawler", "slurp", "lighthouse", "headless")


def analytics_metric(value: float, previous: float) -> AnalyticsMetricOut:
    change = None if previous == 0 else round(((value - previous) / previous) * 100, 1)
    return AnalyticsMetricOut(value=value, previous=previous, change_percent=change)


class AnalyticsService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def record_public_event(
        self,
        payload: AnalyticsEventCreate,
        user_agent: str,
        settings: Settings,
    ) -> bool:
        normalized_agent = user_agent.lower()
        if any(marker in normalized_agent for marker in BOT_MARKERS):
            return False
        organization = self.db.execute(
            select(Organization).where(Organization.slug == payload.organization_slug)
        ).scalar_one_or_none()
        if not organization:
            return False
        hostname = normalize_hostname(payload.hostname)
        mapped_domain = self.db.execute(
            select(Domain.id).where(
                Domain.organization_id == organization.id,
                Domain.hostname == hostname,
                Domain.is_verified.is_(True),
                Domain.provisioning_status == "ready",
            )
        ).scalar_one_or_none()
        if not mapped_domain:
            return False
        session_hash = hashlib.sha256(
            f"{organization.id}:{payload.session_id}:{settings.client_portal_jwt_secret}".encode("utf-8")
        ).hexdigest()
        self.db.add(
            AnalyticsEvent(
                organization_id=organization.id,
                event_type=payload.event_type,
                page_slug=payload.page_slug,
                hostname=hostname,
                session_id_hash=session_hash,
            )
        )
        self.db.commit()
        return True

    def record_client_login(self, organization_id: str) -> None:
        self.db.add(AnalyticsEvent(organization_id=organization_id, event_type="client_login"))

    def summary(self, tenant: TenantContext, days: int) -> AnalyticsSummaryOut:
        if days not in {7, 30, 90}:
            raise ValueError("Analytics period must be 7, 30, or 90 days.")
        now = datetime.now(timezone.utc)
        current_start = now - timedelta(days=days)
        previous_start = current_start - timedelta(days=days)

        current = self._event_totals(tenant.organization_id, current_start, now)
        previous = self._event_totals(tenant.organization_id, previous_start, current_start)
        current_leads = self._lead_total(tenant.organization_id, current_start, now)
        previous_leads = self._lead_total(tenant.organization_id, previous_start, current_start)
        current_conversion = round((current_leads / current["visitors"]) * 100, 1) if current["visitors"] else 0
        previous_conversion = round((previous_leads / previous["visitors"]) * 100, 1) if previous["visitors"] else 0

        return AnalyticsSummaryOut(
            period_days=days,
            visitors=analytics_metric(current["visitors"], previous["visitors"]),
            page_views=analytics_metric(current["page_view"], previous["page_view"]),
            new_enquiries=analytics_metric(current_leads, previous_leads),
            conversion_rate=analytics_metric(current_conversion, previous_conversion),
            phone_clicks=analytics_metric(current["phone_click"], previous["phone_click"]),
            whatsapp_clicks=analytics_metric(current["whatsapp_click"], previous["whatsapp_click"]),
            email_clicks=analytics_metric(current["email_click"], previous["email_click"]),
            client_logins=analytics_metric(current["client_login"], previous["client_login"]),
        )

    def _event_totals(self, organization_id: str, start: datetime, end: datetime) -> dict[str, float]:
        rows = self.db.execute(
            select(AnalyticsEvent.event_type, func.count(AnalyticsEvent.id))
            .where(
                AnalyticsEvent.organization_id == organization_id,
                AnalyticsEvent.created_at >= start,
                AnalyticsEvent.created_at < end,
            )
            .group_by(AnalyticsEvent.event_type)
        ).all()
        totals: dict[str, float] = {
            "page_view": 0,
            "phone_click": 0,
            "whatsapp_click": 0,
            "email_click": 0,
            "client_login": 0,
        }
        totals.update({event_type: float(count) for event_type, count in rows})
        totals["visitors"] = float(
            self.db.scalar(
                select(func.count(distinct(AnalyticsEvent.session_id_hash))).where(
                    AnalyticsEvent.organization_id == organization_id,
                    AnalyticsEvent.event_type == "page_view",
                    AnalyticsEvent.created_at >= start,
                    AnalyticsEvent.created_at < end,
                    AnalyticsEvent.session_id_hash.is_not(None),
                )
            )
            or 0
        )
        return totals

    def _lead_total(self, organization_id: str, start: datetime, end: datetime) -> float:
        return float(
            self.db.scalar(
                select(func.count(Lead.id)).where(
                    Lead.organization_id == organization_id,
                    Lead.created_at >= start,
                    Lead.created_at < end,
                )
            )
            or 0
        )
