# {{projectName}}

FastAPI Layered Architecture.

## Architecture & Dependency Flow

Controllers/API Routes -> Services -> Repositories -> Data Models.
Shared configuration, logging, and error handling live under `core`.
Source dependencies must not point from repositories back into API routes.
