from fastapi import APIRouter, Depends, HTTPException
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from database.db import get_db
from database.models import Project
from schemas import ProjectCreate, ProjectRead

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("", response_model=ProjectRead)
async def create_project(payload: ProjectCreate, db: AsyncSession = Depends(get_db)):
    proj = Project(
        name=payload.name,
        canvas_data=payload.canvas_data,
        thumbnail=payload.thumbnail,
    )
    db.add(proj)
    await db.commit()
    await db.refresh(proj)
    return proj


@router.get("", response_model=List[ProjectRead])
async def list_projects(db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Project).where(Project.is_deleted == False))
    items = q.scalars().all()
    return items


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Project).where(Project.id == project_id))
    proj = q.scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    return proj


@router.put("/{project_id}", response_model=ProjectRead)
async def update_project(
    project_id: UUID, payload: ProjectCreate, db: AsyncSession = Depends(get_db)
):
    q = await db.execute(select(Project).where(Project.id == project_id))
    proj = q.scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    proj.name = payload.name
    proj.canvas_data = payload.canvas_data
    proj.thumbnail = payload.thumbnail
    await db.commit()
    await db.refresh(proj)
    return proj


@router.delete("/{project_id}")
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    q = await db.execute(select(Project).where(Project.id == project_id))
    proj = q.scalar_one_or_none()
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found")
    proj.is_deleted = True
    await db.commit()
    return {"message": "deleted", "project_id": str(project_id)}
