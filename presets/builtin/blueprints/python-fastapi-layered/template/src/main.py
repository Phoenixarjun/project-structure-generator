from fastapi import FastAPI
from {{pythonPackageName}}.api.routes.health import router as health_router

app = FastAPI(title="{{projectName}}")
app.include_router(health_router)
