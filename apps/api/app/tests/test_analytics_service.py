import pytest
from pydantic import ValidationError

from app.schemas.public import AnalyticsEventCreate
from app.services.analytics_service import AnalyticsService, analytics_metric


def test_analytics_metric_compares_equivalent_periods() -> None:
    metric = analytics_metric(15, 10)

    assert metric.value == 15
    assert metric.previous == 10
    assert metric.change_percent == 50


def test_analytics_metric_marks_missing_baseline_as_new() -> None:
    metric = analytics_metric(5, 0)

    assert metric.change_percent is None


def test_public_analytics_event_rejects_unapproved_event_type() -> None:
    with pytest.raises(ValidationError):
        AnalyticsEventCreate(
            organization_slug="firm",
            event_type="admin_login",
            page_slug="home",
            hostname="firm.example.com",
            session_id="1234567890abcdef",
        )


def test_analytics_summary_rejects_unsupported_period_before_querying() -> None:
    service = AnalyticsService(None)  # type: ignore[arg-type]

    with pytest.raises(ValueError):
        service.summary(
            tenant=type("Tenant", (), {"organization_id": "org-1"})(),  # type: ignore[arg-type]
            days=14,
        )
