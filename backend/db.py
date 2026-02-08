"""Compatibility wrapper re-exporting database package symbols.

This file preserves existing imports like `from db import get_db`.
"""
from database.db import (
    engine,
    AsyncSessionLocal,
    get_db,
    create_db_and_tables,
)

__all__ = ["engine", "AsyncSessionLocal", "get_db", "create_db_and_tables"]
