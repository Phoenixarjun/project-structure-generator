from fastapi import FastAPI
from my_fastapi_app.bootstrap.routes import register_routes
from my_fastapi_app.shared.config.settings import settings
from my_fastapi_app.shared.errors.handlers import register_error_handlers
# OpenTelemetry Tracing
import logging
# {{EXTENSION_POINT:application-imports}}

def create_app() -> FastAPI:
    app = FastAPI(title="my-fastapi-app", version="0.1.0")
    register_error_handlers(app)
    register_routes(app)
    # OpenTelemetry Bootstrap Setup
logging.info('OpenTelemetry initialized')
# {{EXTENSION_POINT:application-bootstrap}}
    return app
