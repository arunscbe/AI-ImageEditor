from dotenv import load_dotenv
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

load_dotenv()

# Expect a DATABASE_URL env var, sensible default for local Postgres
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_image_editor",
)

engine = create_async_engine(DATABASE_URL, echo=False, future=True)
AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)


async def get_db():
    """FastAPI dependency - yields an AsyncSession."""
    async with AsyncSessionLocal() as session:
        yield session


async def create_db_and_tables(Base):
    """Create tables using metadata from declarative Base.

    This runs a synchronous metadata.create_all via an async connection.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
