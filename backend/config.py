
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "LaundryPro"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/laundrypro"
    SECRET_KEY: str = "change-this-to-a-random-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    class Config:
        env_file = ".env"


settings = Settings()