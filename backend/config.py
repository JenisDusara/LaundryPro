
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "LaundryPro"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/laundrypro"
    # Render provides INTERNAL_DATABASE_URL when you link a PostgreSQL service
    INTERNAL_DATABASE_URL: str | None = None
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    EMAIL_USER: str = ""
    EMAIL_PASS: str = ""

    class Config:
        env_file = ".env"

    @property
    def database_url(self) -> str:
        """Use INTERNAL_DATABASE_URL on Render when linked, else DATABASE_URL."""
        return self.INTERNAL_DATABASE_URL or self.DATABASE_URL


settings = Settings()