from pydantic import BaseModel

class AuthenticationUsersResponse(BaseModel):
    name: str
    status: str
