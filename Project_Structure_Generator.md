# Project Structure Generator — Consolidated Product Decision

## 1. Final verdict

The project is worth continuing.

The correct product is:

> A deterministic CLI that helps developers select an appropriate, framework-aware project structure, generates a working skeleton, and saves the configuration for reuse across future projects.

It should not be positioned merely as a folder generator, but it also should not become an architecture-governance platform yet.

Its immediate value is:

* removing repetitive project setup
* creating consistent structures across related repositories
* providing curated architectural choices
* allowing teams to reuse approved structures
* generating predictable output without AI

---

## 2. Most important correction

The original composition model was:

```text
Framework blueprint
+ architecture pack
+ capability packs
```

That is too fragile.

Architecture changes fundamental elements such as:

* directory hierarchy
* imports
* dependency direction
* routing
* package boundaries
* application bootstrap
* dependency injection

Therefore, architecture should be included in the base blueprint.

The correct model is:

```text
Architecture-specific base blueprint
+ independent capability packs
+ user variables
= generated project
```

Example:

```text
python-fastapi-feature-modular
+ docker
+ postgres
+ github-actions
+ opentelemetry
```

Not:

```text
python-fastapi
+ feature-modular architecture pack
```

Gemini’s research strongly confirmed this correction.

---

## 3. Final product dimensions

The CLI should treat these as separate decisions:

| Dimension      | Examples                                                    |
| -------------- | ----------------------------------------------------------- |
| Project type   | Backend, frontend, CLI, library, worker                     |
| Language       | Python, Java, Go, TypeScript                                |
| Framework      | FastAPI, Flask, Django, Spring Boot, React, Next.js         |
| Base structure | Layered, feature modular, route-colocated, modular monolith |
| Maturity       | Prototype, Standard, Operational                            |
| Capabilities   | Docker, PostgreSQL, Redis, CI, Terraform, Kubernetes        |
| Reuse          | Saved profile or captured blueprint                         |

The maturity level must not determine the architecture automatically.

For example:

```text
FastAPI
+ Feature Modular
+ Standard
```

and:

```text
FastAPI
+ Feature Modular
+ Operational
```

can share the same source organization while differing in tests, observability, deployment files and operational tooling.

---

## 4. Final maturity levels

Use these names:

### Prototype

For:

* MVPs
* hackathons
* experiments
* learning projects
* small utilities

Includes minimal structure, basic linting, environment configuration and simple tests.

### Standard

For:

* capstone projects
* portfolio projects
* maintained applications
* internal tools
* small teams

Includes clearer module boundaries, unit and integration tests, Docker, CI, structured errors and documentation.

### Operational

For:

* long-lived applications
* team-owned services
* integration-heavy systems
* deployed business systems

Includes health checks, structured logging, metrics, tracing, stronger configuration, integration testing and deployment readiness.

Do not call this tier “Production.” A generated template cannot guarantee that an application is secure, scalable or production-ready. The uploaded research reached the same conclusion.

Capstone should not be a separate maturity level. It can use Standard plus a documentation/showcase pack.

---

## 5. Final user-facing architecture catalogue

The user should see only a small curated set.

### Python

#### FastAPI

* Framework Native
* Layered
* Feature Modular
* Ports and Adapters — advanced

#### Flask

* Blueprint Native
* Layered
* Feature Modular

#### Django

* Django Apps
* Domain-Oriented Apps
* Modular Apps

### Java Spring Boot

* Layered
* Package by Feature
* Modular Monolith
* Ports and Adapters — advanced

`service/impl` must not be generated automatically for every service. Service interfaces should appear only when there is a real abstraction, multiple implementations or an architectural port.

### Go

* Minimal
* Command with `cmd/` and `internal/`
* Domain Modular
* Ports and Adapters — advanced

Do not copy deep Java-style controller/service/repository structures into every Go project.

### React

* Simple Type-Based
* Feature-Based

Example feature:

```text
features/
└── authentication/
    ├── api/
    ├── components/
    ├── hooks/
    ├── schemas/
    ├── types/
    ├── tests/
    └── index.ts
```

Not every subfolder should be created automatically. Generate only the folders required by the selected options.

### Next.js

* App Router Native
* Route-Colocated
* Feature Modular

Example:

```text
src/
├── app/
├── components/
│   ├── ui/
│   └── shared/
├── features/
│   └── authentication/
│       ├── actions/
│       ├── components/
│       ├── hooks/
│       ├── schemas/
│       ├── server/
│       └── types/
├── lib/
├── config/
└── types/
```

The tool must clearly separate:

* route handlers inside `app/api`
* server actions
* server-only feature logic
* client API calls
* shared components
* feature-specific components

### TypeScript CLI

* Minimal CLI
* Command-Oriented CLI
* Modular CLI

Do not add React concepts such as components or hooks to a normal CLI.

---

## 6. Product entry modes

The CLI should provide three paths.

### Quick Template

The user chooses:

```text
Project type
Framework
Maturity
```

The CLI applies recommended defaults.

### Build as You Go

The user chooses:

```text
Project type
Language/framework
Base structure
Maturity
Capabilities
Initial features or modules
```

Advanced infrastructure options should remain behind a separate customization step.

The normal flow should contain approximately five to seven primary questions.

### Reuse From Vault

The user selects an existing profile:

```bash
structgen create --profile aivon-python-service
```

The CLI asks only for unresolved values such as:

```text
Project name
Package name
Initial modules
Output location
```

---

## 7. Blueprint, profile and vault model

### Blueprint

Contains the actual project skeleton:

```text
blueprint.json
template/
```

Examples:

```text
python-fastapi-layered
python-fastapi-feature-modular
java-spring-modular-monolith
nextjs-feature-modular
typescript-cli-command-oriented
```

### Capability pack

Adds an independent capability:

```text
docker
github-actions
postgres
redis
kafka
terraform
kubernetes
opentelemetry
```

Version one packs should mainly add independent files. Packs that require invasive source-code modification should be limited.

### Profile

Stores the user’s selections:

```json
{
  "framework": "fastapi",
  "blueprint": "python-fastapi-feature-modular",
  "maturity": "operational",
  "capabilities": [
    "docker",
    "postgres",
    "redis",
    "github-actions",
    "opentelemetry"
  ]
}
```

### Captured blueprint

Stores a concrete reusable project skeleton captured from an existing repository.

### Vault

```text
.structgen/
└── vault/
    ├── blueprints/
    ├── packs/
    └── profiles/
```

Workspace definitions should override user definitions, and user definitions should override built-ins.

---

## 8. Infrastructure behavior

Infrastructure must remain capability-based.

| Capability             | Suggested location                     |
| ---------------------- | -------------------------------------- |
| Dockerfile             | Project root                           |
| Docker Compose         | Project root                           |
| GitHub Actions         | `.github/workflows/`                   |
| Terraform              | `infra/terraform/`                     |
| Kubernetes             | `deploy/k8s/`                          |
| Helm                   | `deploy/helm/`                         |
| Database migrations    | Framework-specific migration directory |
| Architecture documents | `docs/architecture/`                   |
| ADRs                   | `docs/adr/`                            |

Selecting Operational must not automatically generate Kubernetes, Helm or Terraform. Those must remain explicit choices.

---

## 9. Changes from our earlier proposal

The combined research changes these decisions:

### Architecture packs

Rejected.

Use architecture-specific base blueprints.

### Production maturity name

Rejected.

Use Operational.

### Empty folder generation

Rejected.

Generate working files or `.gitkeep` only where necessary. Do not create ten empty folders inside every feature.

### Clean and hexagonal templates

Keep as advanced templates, not default choices.

They are valuable for certain long-lived and integration-heavy systems, but excessive for ordinary CRUD projects.

### Git-based project updates

Deferred.

Gemini recommended Copier-style three-way merge updates. That is valuable but too large for the first serious release.

Version one should focus on:

```text
Generate
Preview
Validate
Save profile
Capture blueprint
Reuse
```

Project updates and template migrations should come later.

### Initial framework priority

Gemini proposed beginning only with Go, Spring Modulith and Next.js. That does not align with the original Aivon problem.

FastAPI must remain in version one because organization-wide Python service consistency is one of the primary use cases.

---

## 10. Recommended first serious release

Version one should support:

### Base blueprints

```text
python-fastapi-native
python-fastapi-layered
python-fastapi-feature-modular

java-spring-layered
java-spring-package-by-feature
java-spring-modular-monolith

go-minimal
go-command-internal
go-domain-modular

react-simple
react-feature-based

nextjs-app-router-native
nextjs-route-colocated
nextjs-feature-modular

typescript-cli-minimal
typescript-cli-command-oriented
typescript-cli-modular
```

### Capability packs

```text
unit-tests
integration-tests
docker
docker-compose
github-actions
postgres
redis
kafka
structured-logging
opentelemetry
terraform
kubernetes
documentation-showcase
```

### Required product capabilities

```text
Guided generation
Direct blueprint generation
Preview and dry-run
Compatibility validation
Saved profiles
Workspace and user vaults
Captured blueprints
Deterministic output
Overwrite protection
Filesystem safety
```

---

## 11. Explicitly defer

Do not include these in the first serious release:

```text
AI architecture recommendations
Remote template marketplace
Automatic shell execution
AST code modification
Automatic project upgrades
Three-way Git update merging
Microservice generation
Cloud account provisioning
Plugin runtime
Every language and framework
```

---

## Final product definition

> Project Structure Generator is a deterministic CLI that offers curated, framework-aware project structures, allows developers to add compatible development and infrastructure capabilities, and saves approved configurations as reusable profiles or blueprints.

Its differentiation is not that it creates folders.

Its differentiation is:

```text
Guided decisions
+ high-quality curated structures
+ compatibility rules
+ repeatable organizational standards
+ deterministic generation
```

This is now strong enough to proceed to the next phase: freezing the exact template catalogue and generated directory trees before modifying the CLI implementation again.
