from {{pythonPackageName}}.services.health_service import HealthService

def test_health_service():
    service = HealthService()
    res = service.get_health()
    assert res["status"] == "ok"
