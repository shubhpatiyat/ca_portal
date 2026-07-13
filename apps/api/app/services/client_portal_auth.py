import base64
import hashlib
import hmac
import os
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from secrets import choice
from string import ascii_letters, digits

import jwt
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import Domain, FirmClient, Organization
from app.services.page_service import normalize_hostname

PASSWORD_ALPHABET = ascii_letters + digits + "!@#$%?"


@dataclass(frozen=True)
class ClientPortalSession:
    client_id: str
    organization_id: str


def generate_client_password(length: int = 12) -> str:
    return "".join(choice(PASSWORD_ALPHABET) for _ in range(length))


def hash_client_password(password: str) -> str:
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return f"pbkdf2_sha256${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_client_password(password: str, password_hash: str | None) -> bool:
    if not password_hash:
        return False
    try:
        algorithm, salt_value, digest_value = password_hash.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    salt = base64.b64decode(salt_value.encode())
    expected = base64.b64decode(digest_value.encode())
    actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 210_000)
    return hmac.compare_digest(actual, expected)


def create_client_token(client: FirmClient, settings: Settings) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": client.id,
            "organization_id": client.organization_id,
            "scope": "client_portal",
            "iat": int(now.timestamp()),
            "exp": int((now + timedelta(days=7)).timestamp()),
        },
        settings.client_portal_jwt_secret,
        algorithm="HS256",
    )


def verify_client_token(token: str, settings: Settings) -> ClientPortalSession:
    try:
        payload = jwt.decode(token, settings.client_portal_jwt_secret, algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client login is required.") from exc
    if payload.get("scope") != "client_portal":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client login is required.")
    client_id = payload.get("sub")
    organization_id = payload.get("organization_id")
    if not client_id or not organization_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Client login is required.")
    return ClientPortalSession(client_id=client_id, organization_id=organization_id)


def organization_for_host(db: Session, hostname: str) -> Organization:
    normalized = normalize_hostname(hostname)
    organization = db.execute(
        select(Organization)
        .join(Domain, Domain.organization_id == Organization.id)
        .where(Domain.hostname == normalized, Domain.is_verified.is_(True))
    ).scalar_one_or_none()
    if not organization:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Firm portal not found for this domain.")
    return organization
