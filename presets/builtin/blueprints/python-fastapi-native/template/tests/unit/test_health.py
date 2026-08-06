from {{pythonPackageName}}.services.health import get_health_status

def test_get_health_status():
    res = get_health_status()
    assert res["status"] == "ok"
