"""
Simple in-memory cache for downloaded images
Reduces redundant HTTP requests during multi-step workflows
"""
import httpx
import logging
from typing import Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class ImageCache:
    """Simple in-memory cache for image downloads"""
    
    def __init__(self, max_size: int = 100, ttl_minutes: int = 30):
        self._cache: Dict[str, tuple[bytes, datetime]] = {}
        self.max_size = max_size
        self.ttl = timedelta(minutes=ttl_minutes)
        self._hits = 0
        self._misses = 0
    
    def get(self, url: str) -> Optional[bytes]:
        """Get cached image if available and not expired"""
        if url in self._cache:
            content, timestamp = self._cache[url]
            if datetime.now() - timestamp < self.ttl:
                self._hits += 1
                logger.debug(f"Cache HIT for {url[:50]}... (hits: {self._hits}, misses: {self._misses})")
                return content
            else:
                # Expired, remove it
                del self._cache[url]
        
        self._misses += 1
        logger.debug(f"Cache MISS for {url[:50]}... (hits: {self._hits}, misses: {self._misses})")
        return None
    
    def set(self, url: str, content: bytes):
        """Cache image content"""
        # Simple LRU: if cache is full, remove oldest entry
        if len(self._cache) >= self.max_size:
            oldest_url = min(self._cache.keys(), key=lambda k: self._cache[k][1])
            del self._cache[oldest_url]
            logger.debug(f"Cache full, evicted oldest entry")
        
        self._cache[url] = (content, datetime.now())
        logger.debug(f"Cached {url[:50]}... (cache size: {len(self._cache)})")
    
    def clear(self):
        """Clear all cached images"""
        self._cache.clear()
        self._hits = 0
        self._misses = 0
        logger.info("Image cache cleared")
    
    def get_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        total = self._hits + self._misses
        hit_rate = (self._hits / total * 100) if total > 0 else 0
        return {
            "hits": self._hits,
            "misses": self._misses,
            "total_requests": total,
            "hit_rate_percent": round(hit_rate, 2),
            "cache_size": len(self._cache)
        }


# Singleton instance
image_cache = ImageCache()


async def download_image_cached(url: str, client: Optional[httpx.AsyncClient] = None) -> bytes:
    """
    Download image with caching
    
    Args:
        url: Image URL to download
        client: Optional httpx client (creates new one if not provided)
    
    Returns:
        Image bytes
    """
    # Check cache first
    cached = image_cache.get(url)
    if cached is not None:
        return cached
    
    # Download if not cached
    should_close = client is None
    if client is None:
        client = httpx.AsyncClient(timeout=60.0)
    
    try:
        response = await client.get(url)
        response.raise_for_status()
        content = response.content
        
        # Cache the result
        image_cache.set(url, content)
        
        return content
    finally:
        if should_close:
            await client.aclose()
