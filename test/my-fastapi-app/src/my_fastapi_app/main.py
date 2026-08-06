import uvicorn
from my_fastapi_app.bootstrap.application import create_app
from my_fastapi_app.shared.logging.configuration import configure_logging

configure_logging()
app = create_app()

if __name__ == "__main__":
    uvicorn.run("my_fastapi_app.main:app", host="0.0.0.0", port=8000, reload=True)
