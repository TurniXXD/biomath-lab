from pydantic import BaseSettings

class Settings(BaseSettings):
    NEXTAUTH_SECRET: str

    class Config:
        env_file = ".env"

settings = Settings()