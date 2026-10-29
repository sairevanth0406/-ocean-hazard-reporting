from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
import uuid

from app.db.models import Announcement, User
from app.db.session import get_db
from app.api.dependencies import get_current_official, get_current_user

router = APIRouter()

class AnnouncementCreate(BaseModel):
    title: str
    description: str
    priority: str = "Medium"
    location_name: Optional[str] = None
    pincode: Optional[str] = None
    scheduled_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class AnnouncementOut(BaseModel):
    id: str
    official_id: str
    official_name: str
    title: str
    description: str
    priority: str
    location_name: Optional[str]
    pincode: Optional[str]
    scheduled_date: Optional[str]
    expiry_date: Optional[str]
    created_at: str

def _fmt(dt) -> Optional[str]:
    if not dt:
        return None
    if dt.tzinfo is None:
        return dt.isoformat() + "Z"
    return dt.isoformat()

@router.post("", response_model=AnnouncementOut, status_code=201)
async def create_announcement(
    body: AnnouncementCreate,
    current_user: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db),
):
    ann = Announcement(
        id=uuid.uuid4(),
        official_id=current_user.id,
        title=body.title.strip(),
        description=body.description.strip(),
        priority=body.priority,
        location_name=body.location_name,
        pincode=body.pincode,
        scheduled_date=body.scheduled_date,
        expiry_date=body.expiry_date,
    )
    db.add(ann)
    await db.commit()
    await db.refresh(ann)

    return AnnouncementOut(
        id=str(ann.id),
        official_id=str(ann.official_id),
        official_name=current_user.full_name,
        title=ann.title,
        description=ann.description,
        priority=ann.priority,
        location_name=ann.location_name,
        pincode=ann.pincode,
        scheduled_date=_fmt(ann.scheduled_date),
        expiry_date=_fmt(ann.expiry_date),
        created_at=_fmt(ann.created_at),
    )

@router.get("", response_model=List[AnnouncementOut])
async def list_announcements(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Announcement).order_by(desc(Announcement.created_at)).limit(limit)
    )
    announcements = result.scalars().all()

    out = []
    for ann in announcements:
        u_res = await db.execute(select(User).where(User.id == ann.official_id))
        official = u_res.scalars().first()
        out.append(AnnouncementOut(
            id=str(ann.id),
            official_id=str(ann.official_id),
            official_name=official.full_name if official else "Official",
            title=ann.title,
            description=ann.description,
            priority=ann.priority,
            location_name=ann.location_name,
            pincode=ann.pincode,
            scheduled_date=_fmt(ann.scheduled_date),
            expiry_date=_fmt(ann.expiry_date),
            created_at=_fmt(ann.created_at),
        ))
    return out

@router.delete("/{announcement_id}", status_code=204)
async def delete_announcement(
    announcement_id: UUID,
    current_user: User = Depends(get_current_official),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Announcement).where(Announcement.id == announcement_id))
    ann = result.scalars().first()
    if not ann:
        raise HTTPException(status_code=404, detail="Announcement not found")
    if ann.official_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your announcement")
    await db.delete(ann)
    await db.commit()
