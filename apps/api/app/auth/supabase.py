from dataclasses import dataclass
from typing import Any

import jwt
from fastapi import HTTPException, status
from jwt import PyJWKClient

from app.core.config import Settings


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    email: str | None
    claims: dict[str, Any]


class SupabaseJWTVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.jwks_client = PyJWKClient(settings.supabase_jwks_url) if settings.supabase_jwks_url else None

    def verify(self, token: str) -> AuthenticatedUser:
        if not self.jwks_client or not self.settings.supabase_jwt_issuer:
            raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Supabase JWT verification is not configured.")

        try:
            signing_key = self.jwks_client.get_signing_key_from_jwt(token)
            claims = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                audience=self.settings.supabase_jwt_audience,
                issuer=self.settings.supabase_jwt_issuer,
            )
        except jwt.PyJWTError as exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication token.") from exc

        return AuthenticatedUser(user_id=claims["sub"], email=claims.get("email"), claims=claims)
