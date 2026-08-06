from {{pythonPackageName}}.app import create_app

def test_health():
    app = create_app()
    client = app.test_client()
    res = client.get("/health")
    assert res.status_code == 200
