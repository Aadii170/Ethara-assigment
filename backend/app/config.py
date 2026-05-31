"""
Application configuration loaded from environment variables.
Uses pydantic-settings so every value can be overridden at deploy time
without touching source code.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # ------- database -------
    DATABASE_URL: str = "postgresql://ethara:ethara_secret@db:5432/ethara_db"

    # ------- CORS -------
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    # ------- general -------
    DEBUG: bool = False
    APP_TITLE: str = "Ethara — Inventory & Order Management"
    APP_VERSION: str = "1.0.0"

    # allow reading from a .env file sitting next to the project root
    class Config:
        env_file = ".env"
        extra = "ignore"


# single, importable instance
settings = Settings()
