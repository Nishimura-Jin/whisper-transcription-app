from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TranscriptionCreate(BaseModel):
    filename: str
    filler_removal_enabled: bool = False


class TranscriptionResponse(BaseModel):
    id: int
    filename: str
    status: str
    filler_removal_enabled: bool
    transcript: Optional[str] = None
    filler_removed: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
