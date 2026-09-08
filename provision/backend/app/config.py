"""
Application Configuration using Pydantic Settings.
Reads environment variables, provides type validation, and establishes defaults.
"""

from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import json
import os


class Settings(BaseSettings):
    # Base Application Configuration
    PROJECT_NAME: str = "NexusProvision | Developer Onboarding & Cloud Provisioning"
    ENVIRONMENT: str = "development"
    API_V1_PREFIX: str = "/api/v1"

    # Database Configuration
    DATABASE_URL: str = "sqlite:///./provision.db"

    # Security & JWT Configuration
    JWT_SECRET: str = "nexus_enterprise_jwt_secret_key_change_in_production_2026!"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Third-Party Integrations
    GITHUB_TOKEN: str = ""
    GITHUB_ORG: str = "seqa-enterprise"
    SLACK_WEBHOOK_URL: str = ""

    # Initial Superuser Seed Defaults
    FIRST_SUPERUSER_EMAIL: str = "admin@seqa.dev"
    FIRST_SUPERUSER_PASSWORD: str = "AdminPass123!"
    FIRST_SUPERUSER_NAME: str = "System Administrator"

    # CORS Configuration
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return ["*"]

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True,
    )


settings = Settings()
