# Version-One Template Catalogue

The Project Structure Generator ships with an idiomatic, production-quality template catalogue covering major backend, frontend, CLI, and infrastructure architectural blueprints.

## Support Matrix Overview

- **Base Blueprints**: 23 architecture-specific skeletons
- **Capability Packs**: 14 additive infrastructure, database, testing, and deployment options
- **Profiles**: 5 pre-configured starter compositions
- **Maturities**: `prototype`, `standard`, `operational`

## Catalogue Listing

### Python Blueprints
1. `python-fastapi-native` (Prototype): Idiomatic single-file / minimal FastAPI service
2. `python-fastapi-layered` (Standard): Layered FastAPI service (api, core, schemas, services, models, repositories)
3. `python-fastapi-feature-modular` (Standard): Feature-modular FastAPI service with optional feature generator
4. `python-flask-blueprint-native` (Standard): Flask app with native Blueprint organization
5. `python-flask-layered` (Standard): Layered Flask application
6. `python-flask-feature-modular` (Operational): Feature-modular Flask app with shared infrastructure
7. `python-django-apps` (Standard): Standard Django apps layout
8. `python-django-domain-apps` (Standard): Domain-grouped Django apps layout
9. `python-django-modular-apps` (Operational): Modular Django apps layout with environment config splitting

### Java Spring Boot Blueprints
10. `java-spring-layered` (Standard): Layered Spring Boot 3.x Gradle Kotlin DSL service with Gradle wrapper
11. `java-spring-package-by-feature` (Standard): Spring Boot package-by-feature architecture
12. `java-spring-modular-monolith` (Operational): Spring Modulith modular monolith architecture with verification tests

### Go Blueprints
13. `go-minimal` (Prototype): Single-package Go HTTP service / utility
14. `go-command-internal` (Standard): Standard Go layout with `cmd/` entrypoints and `internal/` packages
15. `go-domain-modular` (Operational): Cohesive domain-modular Go architecture without artificial layer packages

### React Blueprints
16. `react-simple` (Standard): Simple Vite + React + TypeScript single-page app
17. `react-feature-based` (Operational): Feature-based React architecture with UI component primitives

### Next.js Blueprints
18. `nextjs-app-router-native` (Standard): Idiomatic Next.js App Router layout
19. `nextjs-route-colocated` (Standard): Next.js App Router with route-colocated components and utilities
20. `nextjs-feature-modular` (Standard): Feature-modular Next.js architecture

### TypeScript CLI Blueprints
21. `typescript-cli-minimal` (Prototype): Minimal single-entry TypeScript CLI
22. `typescript-cli-command-oriented` (Standard): Command-oriented TypeScript CLI
23. `typescript-cli-modular` (Operational): Layered modular TypeScript CLI with subcommands, output formatters, and prompts

## Capability Packs

- `unit-tests`: Unit test runner scaffolding and sample test suites
- `integration-tests`: Integration test environment setup
- `docker`: Multi-stage container build definition (`Dockerfile`)
- `docker-compose`: Multi-container local orchestration (`compose.yaml`)
- `github-actions`: Continuous integration workflows (`.github/workflows/ci.yml`)
- `postgres`: PostgreSQL database connection skeleton
- `redis`: Redis cache connection skeleton
- `kafka`: Apache Kafka event producer/consumer skeleton
- `structured-logging`: JSON structured logging configuration
- `opentelemetry`: OpenTelemetry tracing initialization
- `terraform`: Terraform infrastructure modules (`infra/terraform/`)
- `kubernetes`: Kubernetes deployment and Kustomize overlays (`deploy/k8s/`)
- `helm`: Helm deployment chart (`deploy/helm/`)
- `documentation-showcase`: Architecture and contributor documentation (`docs/ARCHITECTURE.md`)

## Profiles

- `aivon-python-service`: Standard Python FastAPI layered service with Docker, PostgreSQL, and GitHub Actions
- `spring-modular-service`: Operational Java Spring Boot Modular Monolith service profile
- `go-operational-service`: Operational Go domain-modular service profile
- `nextjs-standard-application`: Standard Next.js App Router application profile
- `typescript-cli-tool`: Operational TypeScript CLI application profile

## CLI Commands

```bash
# Display full support matrix
structgen catalogue matrix

# Output support matrix in JSON format
structgen catalogue matrix --json

# Validate all blueprint manifests and template files on disk
structgen catalogue validate
```
