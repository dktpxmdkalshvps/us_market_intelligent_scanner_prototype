"""
Cache layer: Redis preferred, falls back to in-process dict.
"""
import json
import time
import logging
from typing import Any, Optional

logger = logging.getLogger(__name__)


class InMemoryCache:
    """Simple TTL-based in-memory cache (single-process only)."""

    def __init__(self):
        self._store: dict[str, tuple[Any, float]] = {}

    async def connect(self):
        pass

    async def disconnect(self):
        pass

    async def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        value, expiry = entry
        if time.time() > expiry:
            del self._store[key]
            return None
        return value

    async def set(self, key: str, value: Any, ttl: int = 300):
        self._store[key] = (value, time.time() + ttl)

    async def delete(self, key: str):
        self._store.pop(key, None)

    async def flush_prefix(self, prefix: str):
        keys = [k for k in self._store if k.startswith(prefix)]
        for k in keys:
            del self._store[k]


class RedisCache:
    """Redis-backed cache."""

    def __init__(self, url: str):
        self._url = url
        self._client = None

    async def connect(self):
        try:
            import redis.asyncio as aioredis
            self._client = await aioredis.from_url(self._url, decode_responses=True)
            await self._client.ping()
            logger.info("Redis cache connected.")
        except Exception as e:
            logger.warning(f"Redis connection failed ({e}), falling back to in-memory.")
            self._client = None

    async def disconnect(self):
        if self._client:
            await self._client.aclose()

    async def get(self, key: str) -> Optional[Any]:
        if not self._client:
            return None
        raw = await self._client.get(key)
        return json.loads(raw) if raw else None

    async def set(self, key: str, value: Any, ttl: int = 300):
        if self._client:
            await self._client.setex(key, ttl, json.dumps(value))

    async def delete(self, key: str):
        if self._client:
            await self._client.delete(key)

    async def flush_prefix(self, prefix: str):
        if self._client:
            keys = await self._client.keys(f"{prefix}*")
            if keys:
                await self._client.delete(*keys)


def build_cache():
    from .config import settings
    if settings.REDIS_URL:
        return RedisCache(settings.REDIS_URL)
    return InMemoryCache()


cache = build_cache()
