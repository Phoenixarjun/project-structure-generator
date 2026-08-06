from {{pythonPackageName}}.blueprints.health.service import get_health_data

def test_health_service():
    res = get_health_data()
    assert res["status"] == "ok"
