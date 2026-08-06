from fastapi import APIRouter
from my_fastapi_app.features.authentication_users.service import AuthenticationUsersService

router = APIRouter(prefix="/authentication-users", tags=["authentication-users"])
service = AuthenticationUsersService()

@router.get("")
def get_authentication_users():
    return service.get_authentication_users_info()
