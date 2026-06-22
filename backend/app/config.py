from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Por defecto SQLite para desarrollo/pruebas sin setup.
    # En producción (Railway) se sobreescribe con la URL de PostgreSQL.
    database_url: str = "sqlite:///./appbit64.db"

    # Agente IA (opcional — sin esto el endpoint /datos responde en modo fallback)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Auth Google + JWT
    google_client_id: str = ""
    jwt_secret: str = "dev_secret_change_in_production_32chars"
    jwt_algorithm: str = "HS256"
    jwt_expiry_days: int = 30

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def is_sqlite(self) -> bool:
        return self.database_url.startswith("sqlite")


settings = Settings()
