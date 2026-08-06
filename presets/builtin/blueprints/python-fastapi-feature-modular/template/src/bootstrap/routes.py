from fastapi import FastAPI, APIRouter

router = APIRouter()

@router.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "{{projectName}}"}

def register_routes(app: FastAPI) -> None:
    app.include_router(router)
