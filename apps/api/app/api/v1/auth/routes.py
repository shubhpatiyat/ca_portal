import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.supabase import AuthenticatedUser
from app.auth.dependencies import get_current_user
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.schemas.admin import OnboardingOut, OnboardingRequest, SignupLinkOut, SignupLinkRequest
from app.services.page_service import PageService, build_platform_url

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup-link", response_model=SignupLinkOut)
def signup_link(
    payload: SignupLinkRequest,
    settings: Settings = Depends(get_settings),
) -> SignupLinkOut:
    if not settings.supabase_url or not settings.supabase_service_role_key:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase admin auth is not configured.")

    response = httpx.post(
        f"{str(settings.supabase_url).rstrip('/')}/auth/v1/admin/generate_link",
        headers={
            "apikey": settings.supabase_service_role_key,
            "authorization": f"Bearer {settings.supabase_service_role_key}",
            "content-type": "application/json",
        },
        json={
            "type": "signup",
            "email": str(payload.email),
            "password": payload.password,
            "redirect_to": payload.redirect_to,
        },
        timeout=10,
    )

    if response.status_code >= 400:
        raise HTTPException(status_code=response.status_code, detail=response.text)

    data = response.json()
    action_link = data.get("action_link") or data.get("properties", {}).get("action_link")
    if not action_link:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Supabase did not return a signup link.")

    return SignupLinkOut(action_link=action_link)


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
