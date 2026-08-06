import os

class Settings:
    PROJECT_NAME: str = "{{projectName}}"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() in ("true", "1")

settings = Settings()
