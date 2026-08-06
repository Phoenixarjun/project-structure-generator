class HealthService:
    def get_health(self) -> dict:
        return {"status": "ok", "app": "{{projectName}}"}
