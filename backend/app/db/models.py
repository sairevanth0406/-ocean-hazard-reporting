import enum
from sqlalchemy import (
    Column, Integer, String, Boolean, text, ForeignKey, Float,
    TIMESTAMP
)
from sqlalchemy.dialects.postgresql import UUID, ENUM, JSONB
from geoalchemy2 import Geography
from sqlalchemy.orm import relationship
import uuid

# Import the declarative base
from app.db.base import Base

# --- Enums for controlled vocabularies ---
class HazardType(str, enum.Enum):
    tsunami = "tsunami"
    high_waves = "high_waves"
    coastal_flooding = "coastal_flooding"
    storm_surge = "storm_surge"
    rip_current = "rip_current"
    coastal_erosion = "coastal_erosion"
    water_discoloration = "water_discoloration"
    marine_debris = "marine_debris"
    other = "other"

    @classmethod
    def _missing_(cls, value):
        if not value:
            return cls.other
        s = str(value).strip().lower().replace("-", "_").replace(" ", "_")
        for member in cls:
            if member.value == s or member.name == s:
                return member
        label_map = {
            "high_waves_/_swell": cls.high_waves,
            "high_waves": cls.high_waves,
            "swell_surges": cls.high_waves,
            "weather_hazard": cls.high_waves,
            "weather_alert": cls.high_waves,
            "coastal_flooding": cls.coastal_flooding,
            "flooding": cls.coastal_flooding,
            "storm_surge": cls.storm_surge,
            "rip_current": cls.rip_current,
            "coastal_erosion": cls.coastal_erosion,
            "coastal_damage": cls.coastal_erosion,
            "water_discoloration_/_algal_bloom": cls.water_discoloration,
            "water_discoloration": cls.water_discoloration,
            "algal_bloom": cls.water_discoloration,
            "marine_debris_/_pollution": cls.marine_debris,
            "marine_debris": cls.marine_debris,
            "marine_pollution": cls.marine_debris,
            "oil_spill": cls.marine_debris,
            "marine_life": cls.other,
            "marine_life_disturbance": cls.other,
            "suspicious_vessel": cls.other,
            "fishing_violation": cls.other,
            "navigation_hazard": cls.other,
            "coral_damage": cls.other,
            "usual_tides": cls.other,
            "other": cls.other,
        }
        if s in label_map:
            return label_map[s]
        for key, member in label_map.items():
            if key in s or s in key:
                return member
        return cls.other

    # Display labels for the frontend / human-readable output
    @property
    def label(self) -> str:
        labels = {
            "tsunami": "Tsunami",
            "high_waves": "High Waves / Swell",
            "coastal_flooding": "Coastal Flooding",
            "storm_surge": "Storm Surge",
            "rip_current": "Rip Current",
            "coastal_erosion": "Coastal Erosion",
            "water_discoloration": "Water Discoloration / Algal Bloom",
            "marine_debris": "Marine Debris / Pollution",
            "other": "Other",
        }
        return labels.get(self.value, self.value)

class UserRole(str, enum.Enum):
    citizen = "citizen"
    official = "official"
    analyst = "analyst"

class ReportStatus(str, enum.Enum):
    under_verification = "under_verification"
    verified = "verified"
    rejected = "rejected"
    resolved = "resolved"

    @classmethod
    def _missing_(cls, value):
        if not value:
            return cls.under_verification
        s = str(value).strip().lower().replace("-", "_").replace(" ", "_")
        for member in cls:
            if member.value == s or member.name == s:
                return member
        if s in ("submitted", "pending", "in_review", "new"):
            return cls.under_verification
        return cls.under_verification

class ReportUrgency(str, enum.Enum):
    immediate = "immediate"
    moderate = "moderate"
    low = "low"
    rumor = "rumor"

class ReportSentiment(str, enum.Enum):
    panic = "panic"
    calm = "calm"
    confusion = "confusion"

class MediaType(str, enum.Enum):
    image = "image"
    video = "video"
    audio = "audio"

    @classmethod
    def _missing_(cls, value):
        if not value:
            return cls.image
        s = str(value).lower()
        if "video" in s:
            return cls.video
        if "audio" in s or "voice" in s:
            return cls.audio
        return cls.image

class VerificationSource(str, enum.Enum):
    nlp_pipeline = "nlp_pipeline"
    weather_api = "weather_api"
    peer_report = "peer_report"

# --- Main Tables ---

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    bio = Column(String(500), nullable=True)
    location = Column(String(255), nullable=True)
    profile_picture = Column(String(500), nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(ENUM(UserRole, name="user_role"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True) 
    location_updated_at = Column(TIMESTAMP(timezone=True), nullable=True)
    reputation_score = Column(Integer, default=100, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    reports = relationship("Report", back_populates="user")
    safety_circles = relationship("SafetyCircle", back_populates="user")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    user_hazard_type = Column(ENUM(HazardType, name="hazard_type"), nullable=False)
    user_location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False)
    user_description = Column(String)
    user_city = Column(String(255), nullable=True)
    
    status = Column(ENUM(ReportStatus, name="report_status"), nullable=False, default=ReportStatus.under_verification)
    final_confidence_score = Column(Float, default=0.0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)
    
    user = relationship("User", back_populates="reports")
    media_files = relationship("Media", back_populates="report", cascade="all, delete-orphan")
    verifications = relationship("Verification", back_populates="report", cascade="all, delete-orphan")

class Media(Base):
    __tablename__ = "media"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    
    file_url = Column(String, nullable=False)
    media_type = Column(ENUM(MediaType, name="media_type"), nullable=False)
    
    file_metadata = Column(JSONB, nullable=True)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)
    
    report = relationship("Report", back_populates="media_files")

class Verification(Base):
    __tablename__ = "verifications"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("reports.id"), nullable=False)
    
    source = Column(ENUM(VerificationSource, name="verification_source"), nullable=False)
    result_data = Column(JSONB, nullable=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)
    
    report = relationship("Report", back_populates="verifications")


# Safety circles for community notifications and map display

class SafetyCircle(Base):
    __tablename__ = "safety_circles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    notification_id = Column(UUID(as_uuid=True), nullable=False)  # Reference to the notification
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    is_safe = Column(Boolean, nullable=False)  # True for green (safe), False for purple (not safe)
    color = Column(String(7), nullable=False)  # Hex color code
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=False)  # 48 hours from creation
    
    user = relationship("User", back_populates="safety_circles")


class CommunityPost(Base):
    __tablename__ = "community_posts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    content = Column(String(2000), nullable=False)
    category = Column(String(100), nullable=False, default="General")
    location = Column(String(255), nullable=True)
    likes = Column(Integer, default=0, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)

    user = relationship("User", backref="community_posts")
    comments = relationship("CommunityComment", back_populates="post", cascade="all, delete-orphan")


class CommunityComment(Base):
    __tablename__ = "community_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(String(1000), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)

    post = relationship("CommunityPost", back_populates="comments")
    user = relationship("User", backref="community_comments")


class CommunityLike(Base):
    __tablename__ = "community_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    post_id = Column(UUID(as_uuid=True), ForeignKey("community_posts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)



class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    official_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(300), nullable=False)
    description = Column(String(2000), nullable=False)
    priority = Column(String(20), nullable=False, default="Medium")
    location_name = Column(String(255), nullable=True)
    pincode = Column(String(10), nullable=True)
    scheduled_date = Column(TIMESTAMP(timezone=True), nullable=True)
    expiry_date = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("TIMEZONE('utc', now())"), nullable=False)

    official = relationship("User", backref="announcements")
