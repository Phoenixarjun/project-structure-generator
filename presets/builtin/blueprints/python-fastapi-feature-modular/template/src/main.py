import uvicorn
from {{packageNameSnake}}.bootstrap.application import create_app
from {{packageNameSnake}}.shared.logging.configuration import configure_logging

configure_logging()
app = create_app()

if __name__ == "__main__":
    uvicorn.run("{{packageNameSnake}}.main:app", host="0.0.0.0", port=8000, reload=True)
