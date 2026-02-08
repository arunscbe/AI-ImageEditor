"""
Centralized logging configuration for the backend.

This module provides a consistent logging setup across all backend modules.
Import and use: `from logger import get_logger`

Example:
    from logger import get_logger
    logger = get_logger(__name__)
    logger.info("This is an info message")
    logger.error("This is an error message", exc_info=True)
"""
import logging
import os
import sys
from typing import Optional


def setup_logging(
    level: Optional[str] = None,
    format_string: Optional[str] = None,
    log_file: Optional[str] = None
) -> None:
    """
    Configure logging for the application.
    
    Args:
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
               Defaults to LOG_LEVEL env var or INFO
        format_string: Custom format string for log messages
        log_file: Optional file path to write logs to
    """
    # Get log level from environment or use INFO as default
    if level is None:
        level = os.getenv("LOG_LEVEL", "INFO").upper()
    
    log_level = getattr(logging, level, logging.INFO)
    
    # Default format string
    if format_string is None:
        format_string = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Configure handlers
    handlers = [logging.StreamHandler(sys.stdout)]
    
    # Add file handler if log_file is specified
    if log_file:
        file_handler = logging.FileHandler(log_file)
        handlers.append(file_handler)
    
    # Configure logging
    logging.basicConfig(
        level=log_level,
        format=format_string,
        handlers=handlers,
        force=True  # Override any existing configuration
    )


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance for the given module name.
    
    Args:
        name: Module name (typically __name__)
    
    Returns:
        Logger instance configured with the module name
    """
    return logging.getLogger(name)


# Initialize logging on module import
# This ensures logging is configured before any other modules try to use it
setup_logging()

# Export convenience function
__all__ = ['get_logger', 'setup_logging']
