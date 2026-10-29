"""
Aggregates all endpoint routers under a single APIRouter that
`app.main` mounts at `/api`.
"""
from fastapi import APIRouter

from app.api.endpoints import (
    analyst,
    announcements,
    auth,
    community,
    feed,
    image_upload,
    notifications,
    official,
    reports,
    resources,
    safety_circles,
    social_feed,
    sync,
    users,
    verifications,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/user", tags=["User"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(verifications.router, prefix="/verifications", tags=["Verifications"])
api_router.include_router(feed.router, prefix="/feed", tags=["Feed"])
api_router.include_router(resources.router, prefix="/resources", tags=["Emergency Resources"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(safety_circles.router, prefix="/safety-circles", tags=["Safety Circles"])
api_router.include_router(sync.router, prefix="/sync", tags=["Offline Sync"])
api_router.include_router(official.router, prefix="/official", tags=["Official"])
api_router.include_router(announcements.router, prefix="/announcements", tags=["Announcements"])
api_router.include_router(analyst.router, prefix="/analyst", tags=["Analyst"])
api_router.include_router(community.router, prefix="/community", tags=["Community"])
api_router.include_router(social_feed.router, prefix="/social", tags=["Social Feed"])
api_router.include_router(image_upload.router, prefix="/image", tags=["Image Upload"])

__all__ = ["api_router"]
