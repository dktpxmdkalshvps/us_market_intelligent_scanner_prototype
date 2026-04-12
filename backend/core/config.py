from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/quantscreen"

    # Redis (optional – falls back to in-memory cache)
    REDIS_URL: str = ""

    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://quantscreen.vercel.app",
    ]

    # Cache TTL (seconds)
    CACHE_TTL_THEME: int = 300       # 5 min – theme stock lists
    CACHE_TTL_MARKET: int = 60       # 1 min – market indices / FX
    CACHE_TTL_STOCK: int = 900       # 15 min – individual stock details

    # Data fetch
    SP500_CSV_URL: str = (
        "https://raw.githubusercontent.com/datasets/s-and-p-500-companies"
        "/master/data/constituents.csv"
    )
    NASDAQ100_CSV_URL: str = (
        "https://raw.githubusercontent.com/datasets/nasdaq-listings"
        "/master/data/nasdaq-listed.csv"
    )

    # Scheduler (America/New_York) – run 1h after US market close
    SCHEDULER_HOUR: int = 17
    SCHEDULER_MINUTE: int = 30
    SCHEDULER_TIMEZONE: str = "America/New_York"

    # Risk filter defaults
    RISK_MIN_PRICE: float = 1.0
    RISK_MIN_MARKET_CAP: float = 50_000_000  # $50M
    RISK_EXCLUDE_SUFFIXES: List[str] = [".Q", ".E", ".PK", ".OB"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
