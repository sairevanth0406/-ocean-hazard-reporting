from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc
from typing import List, Optional
from uuid import UUID
from pydantic import BaseModel
import uuid

from app.db.models import CommunityPost, CommunityComment, CommunityLike, User
from app.db.session import get_db
from app.api.dependencies import get_current_user

router = APIRouter()

# ---------- Pydantic schemas ----------

class PostCreate(BaseModel):
    title: str
    content: str
    category: str = "General"
    location: Optional[str] = None

class CommentCreate(BaseModel):
    content: str

class CommentOut(BaseModel):
    id: str
    post_id: str
    user_id: str
    author_name: str
    author_initials: str
    content: str
    created_at: str

class PostOut(BaseModel):
    id: str
    user_id: str
    author_name: str
    author_initials: str
    author_role: str
    title: str
    content: str
    category: str
    location: Optional[str]
    likes: int
    liked_by_me: bool
    comment_count: int
    created_at: str
    comments: List[CommentOut] = []

class StatsOut(BaseModel):
    total_posts: int
    total_members: int
    posts_this_week: int

# ---------- Helpers ----------

def _initials(name: str) -> str:
    parts = (name or "U").split()
    return "".join(p[0] for p in parts[:2]).upper()

def _fmt(dt) -> str:
    if not dt:
        return ""
    # Ensure UTC timezone is appended so frontend parses correctly
    if dt.tzinfo is None:
        return dt.isoformat() + "Z"
    return dt.isoformat()

# ---------- Routes ----------

@router.get("/posts", response_model=List[PostOut])
async def list_posts(
    category: Optional[str] = None,
    search: Optional[str] = None,
    sort: str = Query("recent", pattern="^(recent|popular)$"),
    limit: int = Query(30, ge=1, le=100),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(CommunityPost)
    if category and category != "All":
        q = q.where(CommunityPost.category == category)
    if search:
        q = q.where(
            CommunityPost.title.ilike(f"%{search}%") |
            CommunityPost.content.ilike(f"%{search}%")
        )
    if sort == "popular":
        q = q.order_by(desc(CommunityPost.likes), desc(CommunityPost.created_at))
    else:
        q = q.order_by(desc(CommunityPost.created_at))
    q = q.offset(offset).limit(limit)

    result = await db.execute(q)
    posts = result.scalars().all()

    # Fetch liked post ids for current user
    liked_res = await db.execute(
        select(CommunityLike.post_id).where(CommunityLike.user_id == current_user.id)
    )
    liked_ids = {str(row[0]) for row in liked_res.all()}

    out = []
    for p in posts:
        # author
        u_res = await db.execute(select(User).where(User.id == p.user_id))
        author = u_res.scalars().first()
        author_name = author.full_name if author else "Unknown"
        author_role = author.role.value if author else "citizen"

        # comment count
        cc_res = await db.execute(
            select(func.count(CommunityComment.id)).where(CommunityComment.post_id == p.id)
        )
        comment_count = cc_res.scalar() or 0

        out.append(PostOut(
            id=str(p.id),
            user_id=str(p.user_id),
            author_name=author_name,
            author_initials=_initials(author_name),
            author_role=author_role,
            title=p.title,
            content=p.content,
            category=p.category,
            location=p.location,
            likes=p.likes,
            liked_by_me=str(p.id) in liked_ids,
            comment_count=comment_count,
            created_at=_fmt(p.created_at),
            comments=[],
        ))
    return out


@router.post("/posts", response_model=PostOut, status_code=201)
async def create_post(
    body: PostCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    post = CommunityPost(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=body.title.strip(),
        content=body.content.strip(),
        category=body.category,
        location=body.location,
        likes=0,
    )
    db.add(post)
    await db.commit()
    await db.refresh(post)

    return PostOut(
        id=str(post.id),
        user_id=str(post.user_id),
        author_name=current_user.full_name,
        author_initials=_initials(current_user.full_name),
        author_role=current_user.role.value,
        title=post.title,
        content=post.content,
        category=post.category,
        location=post.location,
        likes=0,
        liked_by_me=False,
        comment_count=0,
        created_at=_fmt(post.created_at),
        comments=[],
    )


@router.post("/posts/{post_id}/like", status_code=200)
async def toggle_like(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check post exists
    p_res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    post = p_res.scalars().first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    # Check existing like
    like_res = await db.execute(
        select(CommunityLike).where(
            CommunityLike.post_id == post_id,
            CommunityLike.user_id == current_user.id,
        )
    )
    existing = like_res.scalars().first()

    if existing:
        await db.delete(existing)
        post.likes = max(0, post.likes - 1)
        liked = False
    else:
        db.add(CommunityLike(id=uuid.uuid4(), post_id=post_id, user_id=current_user.id))
        post.likes += 1
        liked = True

    await db.commit()
    return {"liked": liked, "likes": post.likes}


@router.get("/posts/{post_id}/comments", response_model=List[CommentOut])
async def get_comments(
    post_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    res = await db.execute(
        select(CommunityComment)
        .where(CommunityComment.post_id == post_id)
        .order_by(CommunityComment.created_at)
    )
    comments = res.scalars().all()

    out = []
    for c in comments:
        u_res = await db.execute(select(User).where(User.id == c.user_id))
        author = u_res.scalars().first()
        author_name = author.full_name if author else "Unknown"
        out.append(CommentOut(
            id=str(c.id),
            post_id=str(c.post_id),
            user_id=str(c.user_id),
            author_name=author_name,
            author_initials=_initials(author_name),
            content=c.content,
            created_at=_fmt(c.created_at),
        ))
    return out


@router.post("/posts/{post_id}/comments", response_model=CommentOut, status_code=201)
async def add_comment(
    post_id: UUID,
    body: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    p_res = await db.execute(select(CommunityPost).where(CommunityPost.id == post_id))
    if not p_res.scalars().first():
        raise HTTPException(status_code=404, detail="Post not found")

    comment = CommunityComment(
        id=uuid.uuid4(),
        post_id=post_id,
        user_id=current_user.id,
        content=body.content.strip(),
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)

    return CommentOut(
        id=str(comment.id),
        post_id=str(comment.post_id),
        user_id=str(comment.user_id),
        author_name=current_user.full_name,
        author_initials=_initials(current_user.full_name),
        content=comment.content,
        created_at=_fmt(comment.created_at),
    )


@router.get("/stats", response_model=StatsOut)
async def community_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    from datetime import datetime, timedelta, timezone
    week_ago = datetime.now(timezone.utc) - timedelta(days=7)

    total_posts_res = await db.execute(select(func.count(CommunityPost.id)))
    total_posts = total_posts_res.scalar() or 0

    total_members_res = await db.execute(select(func.count(User.id)))
    total_members = total_members_res.scalar() or 0

    week_posts_res = await db.execute(
        select(func.count(CommunityPost.id)).where(CommunityPost.created_at >= week_ago)
    )
    posts_this_week = week_posts_res.scalar() or 0

    return StatsOut(
        total_posts=total_posts,
        total_members=total_members,
        posts_this_week=posts_this_week,
    )
