from fastapi import FastAPI

from api.routers.health import router

app = FastAPI(title="{{projectName}}")
app.include_router(router)
