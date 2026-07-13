from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.admin.routes import router as admin_router
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.client.routes import router as client_router
from app.api.v1.public.routes import router as public_router
from app.core.config import get_settings
from app.core.logging import configure_logging

settings = get_settings()
configure_logging(settings.log_level)

app = FastAPI(title="CA Site Platform API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_origin_regex=settings.cors_allow_origin_regex,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(public_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(client_router, prefix="/api/v1")


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok"}
