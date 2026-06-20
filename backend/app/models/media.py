from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func
import uuid
from ..db.database import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    public_url = Column(String, nullable=False)
    cloudinary_key = Column(String, nullable=True)
    media_type = Column(String, nullable=False)  # image | video | document
    size_bytes = Column(Integer, default=0)
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    format = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
