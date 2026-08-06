from my_fastapi_app.features.authentication_users.repository import AuthenticationUsersRepository

class AuthenticationUsersService:
    def __init__(self):
        self.repo = AuthenticationUsersRepository()

    def get_authentication_users_info(self):
        return self.repo.find()
