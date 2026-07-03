from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.supabase import AuthenticatedUser
from app.auth.dependencies import get_current_user
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.admin import OnboardingOut, OnboardingRequest
from app.services.page_service import PageService, build_platform_url

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/onboarding", response_model=OnboardingOut, status_code=201)
def onboarding(
    payload: OnboardingRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> OnboardingOut:
    organization = PageService(db).create_onboarding_site(payload, user.user_id, settings)
    default_subdomain = organization.website_config.default_subdomain if organization.website_config else None
    return OnboardingOut(
        organization_slug=organization.slug,
        default_subdomain=default_subdomain,
        default_url=build_platform_url(default_subdomain, settings),
        preview_url=f"/admin/website/preview",
    )
