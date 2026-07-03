from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import MediaAsset
from app.schemas.sections import PageSection


def extract_asset_ids(sections: list[PageSection]) -> set[str]:
    asset_ids: set[str] = set()
    for section in sections:
        content = section.content_json
        asset_id = getattr(content, "image_asset_id", None)
        if asset_id:
            asset_ids.add(asset_id)
    return asset_ids


def assert_assets_belong_to_org(db: Session, organization_id: str, sections: list[PageSection]) -> None:
    asset_ids = extract_asset_ids(sections)
    if not asset_ids:
        return
    rows = db.execute(
        select(MediaAsset.id).where(MediaAsset.organization_id == organization_id, MediaAsset.id.in_(asset_ids))
    ).scalars().all()
    missing = asset_ids.difference(set(rows))
    if missing:
        raise ValueError("One or more selected images do not belong to this organization.")
