from fastapi import APIRouter
from {{pythonPackageName}}.schemas.health import HealthResponse
from {{pythonPackageName}}.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["health"])

@router.get("", response_model=HealthResponse)
def health_check():
    service = HealthService()
    return service.get_health()
