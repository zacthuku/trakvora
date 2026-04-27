from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+asyncpg://trakvora:trakvora@localhost:5432/trakvora"
    secret_key: str = "change-me-in-production"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7
    environment: str = "development"
    cors_origins: str = "http://localhost:5173"

    flutterwave_secret_key: str = ""
    smile_identity_api_key: str = ""
    africastalking_api_key: str = ""
    africastalking_username: str = "sandbox"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",")]


settings = Settings()
