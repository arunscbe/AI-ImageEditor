from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from database.db import get_db
from database.models import Image
from schemas import ImageCreate, ImageRead

router = APIRouter(prefix="/images", tags=["images"])


@router.post("", response_model=ImageRead)
async def create_image(payload: ImageCreate, db: AsyncSession = Depends(get_db)):
    img = Image(
        project_id=payload.project_id,
        original_path=payload.original_path,
        metadata_json=payload.metadata_json,
    )
    db.add(img)
    await db.commit()
    await db.refresh(img)
    return img


@router.get("", response_model=List[ImageRead])
async def list_images(
    project_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db)
):
    stmt = select(Image)
    if project_id:
        stmt = stmt.where(Image.project_id == project_id)
    q = await db.execute(stmt)
    return q.scalars().all()


@router.get("/{image_id}", response_model=ImageRead)
async def get_image(image_id: UUID, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Image).where(Image.id == image_id))
    img = q.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    return img


@router.delete("/{image_id}")
async def delete_image(image_id: UUID, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Image).where(Image.id == image_id))
    img = q.scalar_one_or_none()
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    await db.delete(img)
    await db.commit()
    return {"message": "deleted", "image_id": str(image_id)}
