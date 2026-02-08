from pydantic import BaseModel
from typing import Optional, Dict, Any
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    canvas_data: Optional[Dict[str, Any]] = None
    thumbnail: Optional[str] = None


class ProjectRead(ProjectCreate):
    id: UUID
    revision_number: Optional[int] = 1
    is_deleted: Optional[bool] = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class ImageCreate(BaseModel):
    project_id: Optional[UUID] = None
    original_path: str
    metadata_json: Optional[Dict[str, Any]] = None


class ImageRead(ImageCreate):
    id: UUID
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True
