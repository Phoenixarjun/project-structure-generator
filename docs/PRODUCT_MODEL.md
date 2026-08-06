# Product Model Specification

`project-structure-generator` provides a deterministic multi-tier model for composing production-ready software project Skeletons.

## Core Dimensions

1. **Project Types**:
   - `backend-service`: Server applications, APIs, microservices.
   - `frontend-application`: Web client applications, SPAs, SSR web apps.
   - `fullstack-application`: Integrated front/back applications.
   - `cli`: Command-line interface applications and devtools.
   - `library`: Reusable packages and modules.
   - `worker`: Background processing, queue consumers, cron tasks.

2. **Languages**:
   - `python`: Python 3.11+
   - `java`: Java 17+
   - `go`: Go 1.21+
   - `typescript`: Node.js / Browser TypeScript

3. **Frameworks**:
   - `fastapi`, `flask`, `django`, `spring-boot`, `go-standard-library`, `react`, `nextjs`, `typescript-node`

4. **Base Blueprints**:
   - Base blueprints own the primary architectural structure (e.g. `python-fastapi-feature-modular`, `java-spring-modular-monolith`, `nextjs-feature-modular`, `typescript-cli-command-oriented`). Architecture is embedded inside the base blueprint, not applied as a separate pack.

5. **Maturity Levels**:
   - `prototype`: Minimal runnable skeleton for fast iteration.
   - `standard`: Recommended production structure with unit testing and containerization.
   - `operational`: Full production scaffolding including observability, CI workflows, and documentation.

6. **Capability Packs**:
   - Reusable additive capability units (`unit-tests`, `integration-tests`, `docker`, `docker-compose`, `github-actions`, `postgres`, `redis`, `kafka`, `structured-logging`, `opentelemetry`, `terraform`, `kubernetes`, `helm`, `documentation-showcase`).

7. **Profiles**:
   - Versioned JSON configuration manifests capturing saved choices (`projectType`, `language`, `framework`, `blueprint`, `maturity`, `capabilities`, `features`, `variables`, `output`). Profiles never store secret variables.

8. **Provenance Metadata**:
   - Generated projects contain `.structgen.json` recording generator version, blueprint origin, selected maturity, capability packs, variables used, and generated file paths.
