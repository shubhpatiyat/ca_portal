from functools import lru_cache
from pathlib import Path

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

API_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/ca_site_platform")
    supabase_url: AnyHttpUrl | None = None
    supabase_service_role_key: str | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwt_audience: str = "authenticated"
    cors_origins: str = "http://localhost:3000"
    cors_allow_origin_regex_value: str | None = Field(default=None, alias="CORS_ALLOW_ORIGIN_REGEX")
    next_revalidate_url: AnyHttpUrl | None = None
    next_revalidate_secret: str | None = None
    platform_domain: str = "lvh.me"
    platform_scheme: str = "http"
    log_level: str = "INFO"

    model_config = SettingsConfigDict(env_file=API_DIR / ".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def sqlalchemy_database_url(self) -> str:
        if self.database_url.startswith("postgresql+psycopg://"):
            return self.database_url
        if self.database_url.startswith("postgresql://"):
            return self.database_url.replace("postgresql://", "postgresql+psycopg://", 1)
        if self.database_url.startswith("postgres://"):
            return self.database_url.replace("postgres://", "postgresql+psycopg://", 1)
        return self.database_url

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def cors_allow_origin_regex(self) -> str | None:
        if self.cors_allow_origin_regex_value:
            return self.cors_allow_origin_regex_value
        if self.app_env == "development":
            return r"^https?://(localhost|127\.0\.0\.1):\d+$"
        return None

    @property
    def supabase_jwks_url(self) -> str | None:
        if not self.supabase_url:
            return None
        return f"{str(self.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json"


@lru_cache
def get_settings() -> Settings:
    return Settings()
