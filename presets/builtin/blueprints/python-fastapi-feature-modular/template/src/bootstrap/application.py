from fastapi import FastAPI
from {{packageNameSnake}}.bootstrap.routes import register_routes
from {{packageNameSnake}}.shared.config.settings import settings
from {{packageNameSnake}}.shared.errors.handlers import register_error_handlers
# {{EXTENSION_POINT:application-imports}}

def create_app() -> FastAPI:
    app = FastAPI(title="{{projectName}}", version="0.1.0")
    register_error_handlers(app)
    register_routes(app)
    # {{EXTENSION_POINT:application-bootstrap}}
    return app
