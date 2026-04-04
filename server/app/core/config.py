from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_CORS_ORIGINS = (
    "http://localhost:3000,"
    "http://127.0.0.1:3000,"
    "https://biomath-lab.vantuch.dev"
)

class Settings(BaseSettings):
    NEXTAUTH_SECRET: str
    CORS_ALLOW_ORIGINS: str = Field(default=DEFAULT_CORS_ORIGINS)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_allow_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.CORS_ALLOW_ORIGINS.split(",")
            if origin.strip()
        ]

settings = Settings()
