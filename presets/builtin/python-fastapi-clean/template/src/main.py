from fastapi import FastAPI

from {{packageName}}.api.router import router

app = FastAPI(title="{{projectName}}")
app.include_router(router)
