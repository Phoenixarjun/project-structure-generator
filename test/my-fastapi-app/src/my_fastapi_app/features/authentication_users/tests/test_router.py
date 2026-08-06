from my_fastapi_app.features.authentication_users.service import AuthenticationUsersService

def test_authentication_users_service():
    s = AuthenticationUsersService()
    res = s.get_authentication_users_info()
    assert res["name"] == "authentication-users"
