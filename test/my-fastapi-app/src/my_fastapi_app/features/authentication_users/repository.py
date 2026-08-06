from my_fastapi_app.features.authentication_users.models import AuthenticationUsersModel

class AuthenticationUsersRepository:
    def find(self):
        model = AuthenticationUsersModel(name="authentication-users", status="active")
        return {"name": model.name, "status": model.status}
