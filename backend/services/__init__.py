"""
Services package
Shared business logic for image operations and ingestion
"""
from .image_operations import image_operations
from .ingestion_service import ingestion_service
try:
	from .db_service import get_session  # compatibility wrapper
except Exception:
	# db_service may have moved to database.services
	get_session = None

__all__ = ['image_operations', 'ingestion_service', 'get_session']
