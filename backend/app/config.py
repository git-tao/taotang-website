"""Application configuration loaded from environment variables."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # Supabase
    supabase_url: str
    supabase_service_role_key: str

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""

    # App settings
    debug: bool = False
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    # Gate configuration (can be tuned without code changes)
    gate_min_context_length: int = 100
    gate_min_budget_threshold: str = "10k_25k"  # Minimum budget to pass gate

    # Versioning
    form_version: str = "1.0.0"
    rules_version: str = "1.0.0"
    answers_version: str = "1.0.0"

    # Personal email domains to flag
    personal_email_domains: list[str] = [
        "gmail.com",
        "yahoo.com",
        "hotmail.com",
        "outlook.com",
        "aol.com",
        "icloud.com",
        "mail.com",
        "protonmail.com",
        "zoho.com",
    ]

    class Config:
        env_file = "../.env.local"  # Relative to backend/
        env_file_encoding = "utf-8"
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
