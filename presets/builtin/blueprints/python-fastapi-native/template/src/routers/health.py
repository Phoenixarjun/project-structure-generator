from fastapi import APIRouter
from {{pythonPackageName}}.schemas.health import HealthResponse
from {{pythonPackageName}}.services.health import get_health_status

router = APIRouter(prefix="/health", tags=["health"])

@router.get("", response_model=HealthResponse)
def health_check():
    return get_health_status()
