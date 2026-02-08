"""Compatibility wrapper re-exporting Pydantic schemas from `database.schemas`.

Legacy imports like `from schemas import ProjectCreate` will continue to work.
"""

from database.schemas import ProjectCreate, ProjectRead, ImageCreate, ImageRead

__all__ = ["ProjectCreate", "ProjectRead", "ImageCreate", "ImageRead"]
