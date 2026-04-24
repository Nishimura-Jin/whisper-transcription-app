from app.db.database import Base
from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func


class Transcription(Base):
    __tablename__ = "transcriptions"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    transcript = Column(Text, nullable=True)
    filler_removed = Column(Text, nullable=True)
    filler_removal_enabled = Column(Boolean, default=False)
    file_format = Column(String, default="txt")
    status = Column(String, default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
