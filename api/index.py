"""
Vercel Serverless Entry Point for FastAPI.
File: api/index.py
"""
import sys
import os

# Add backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from backend.main import app  # noqa: F401 - Vercel picks up 'app'
