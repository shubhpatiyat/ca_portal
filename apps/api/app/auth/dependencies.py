from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth.supabase import AuthenticatedUser, SupabaseJWTVerifier
from app.core.config import Settings, get_settings
from app.db.session import get_db
from app.models import Organization, OrganizationMember
from app.schemas.admin import TenantContext


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    settings: Settings = Depends(get_settings),
) -> AuthenticatedUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication is required.")
    return SupabaseJWTVerifier(settings).verify(authorization.removeprefix("Bearer ").strip())


def get_tenant_context(
    user: AuthenticatedUser = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TenantContext:
    row = db.execute(
        select(OrganizationMember, Organization)
        .join(Organization, Organization.id == OrganizationMember.organization_id)
        .where(OrganizationMember.user_id == user.user_id)
        .order_by(OrganizationMember.created_at.asc())
    ).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No organization membership found.")
    member, organization = row
    return TenantContext(
        user_id=user.user_id,
        organization_id=organization.id,
        organization_slug=organization.slug,
        role=member.role,
    )


def require_owner(tenant: TenantContext = Depends(get_tenant_context)) -> TenantContext:
    if tenant.role != "owner":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an owner can publish or manage this setting.")
    return tenant


def require_editor(tenant: TenantContext = Depends(get_tenant_context)) -> TenantContext:
    if tenant.role not in {"owner", "editor"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Editor access is required.")
    return tenant
