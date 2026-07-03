from pathlib import PurePosixPath
from uuid import uuid4

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import Settings
from app.models import MediaAsset
from app.schemas.admin import ConfirmUploadRequest, PresignUploadOut, PresignUploadRequest, TenantContext

EXT_BY_MIME = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
}


class MediaService:
    def __init__(self, db: Session, settings: Settings) -> None:
        self.db = db
        self.settings = settings

    def presign_upload(self, tenant: TenantContext, payload: PresignUploadRequest) -> PresignUploadOut:
        ext = EXT_BY_MIME[payload.mime_type]
        path = PurePosixPath("org") / tenant.organization_id / payload.purpose / f"{uuid4()}.{ext}"
        base = str(self.settings.supabase_url).rstrip("/") if self.settings.supabase_url else "http://localhost:54321"
        public_url = f"{base}/storage/v1/object/public/website-assets/{path}"
        return PresignUploadOut(storage_path=str(path), upload_url=public_url, public_url=public_url)

    def confirm_upload(self, tenant: TenantContext, payload: ConfirmUploadRequest) -> MediaAsset:
        prefix = f"org/{tenant.organization_id}/"
        if not payload.storage_path.startswith(prefix):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Storage path is outside this organization.")
        asset = MediaAsset(
            organization_id=tenant.organization_id,
            storage_path=payload.storage_path,
            public_url=payload.public_url,
            mime_type=payload.mime_type,
            file_name=payload.file_name,
            size_bytes=payload.size_bytes,
            width=payload.width,
            height=payload.height,
            uploaded_by_user_id=tenant.user_id,
        )
        self.db.add(asset)
        self.db.commit()
        self.db.refresh(asset)
        return asset

    def list_assets(self, tenant: TenantContext) -> list[MediaAsset]:
        return list(self.db.execute(select(MediaAsset).where(MediaAsset.organization_id == tenant.organization_id)).scalars())

    def delete_asset(self, tenant: TenantContext, media_id: str) -> None:
        asset = self.db.execute(
            select(MediaAsset).where(MediaAsset.organization_id == tenant.organization_id, MediaAsset.id == media_id)
        ).scalar_one_or_none()
        if not asset:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media asset not found.")
        self.db.delete(asset)
        self.db.commit()
