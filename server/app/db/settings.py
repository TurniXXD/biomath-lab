from pydantic_settings import BaseSettings, SettingsConfigDict

# todo needed?
class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str  # e.g. postgresql+asyncpg://user:pass@localhost:5432/mydb


settings = Settings()