"""
Database Initialization Script
Run once to create all tables:
  python scripts/init_db.py
"""
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy import create_engine
from backend.models.stock import Base
from backend.core.config import settings


def init_db():
    print(f"Connecting to: {settings.DATABASE_URL[:40]}...")
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✓ All tables created successfully.")
    print("Tables:", list(Base.metadata.tables.keys()))


if __name__ == "__main__":
    init_db()
