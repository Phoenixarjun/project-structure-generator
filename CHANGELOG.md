# Changelog

All notable changes to Project Structure Generator (`@naresh007/project-structure-generator`) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2026-08-06

### Fixed
- Disambiguated positional output directory path from preset ID when invoking CLI commands (`structgen create ./output-dir`).

## [0.2.4] - 2026-08-06

### Fixed
- Added `@types/node`, `@types/react`, and `@types/react-dom` devDependencies to Next.js template `package.json`.
- Standardized self-contained test modules for frontend feature templates.

## [0.2.3] - 2026-08-06

### Fixed
- Completed full Next.js Feature-Modular architecture templates (`layout.tsx`, route handlers, server actions, server-only DAL).
- Completed React Feature-Based component structures and UI/shared components READMEs.
- Fixed interactive multiselect comma and space input parsing (`1 2 3 4`).
- Added entry-mode parity verification test suite (`tests/parity.test.ts`).

## [0.2.2] - 2026-08-06

### Fixed
- Completed architecture templates for `python-fastapi-feature-modular`, `react-feature-based`, and `django-*` blueprints.
- Fixed capability pack `entries` manifest schema parsing so all 14 packs contribute files and config.
- Upgraded interactive multiselect prompt to toggle selections while preserving recommended defaults.
- Added interactive initial feature prompt and default feature generation.

## [0.2.1] - 2026-08-06

### Fixed
- Published production catalogue blueprints, CLI `--version` flag, and OIDC provenance.

## [0.2.0] - 2026-08-06

### Added
- **Version-One Template Catalogue**: Complete production-quality catalogue featuring 23 base blueprints across Python (FastAPI, Flask, Django), Java Spring Boot, Go, React, Next.js, and TypeScript CLI.
- **14 Capability Packs**: Additive infra, database, testing, and CI scaffolding (`docker`, `docker-compose`, `github-actions`, `postgres`, `redis`, `kafka`, `structured-logging`, `opentelemetry`, `terraform`, `kubernetes`, `helm`, `documentation-showcase`).
- **5 Built-in Profiles**: Pre-configured composition profiles (`aivon-python-service`, `spring-modular-service`, `go-operational-service`, `nextjs-standard-application`, `typescript-cli-tool`).
- **Catalogue CLI Commands**: Added `structgen catalogue validate` and `structgen catalogue matrix`.
- **Maturity Levels**: Formal maturity tiers (`prototype`, `standard`, `operational`).
- **Filesystem Security**: Rejection of Windows reserved filenames (`CON`, `NUL`, `AUX`, etc.), trailing dots/spaces, symlink traps, and forbidden shell hooks.
- **Automated Verification**: Integration test suites for catalogue validation, representative capability combinations, generated project smoke tests, and npm package tarball content checks.

### Changed
- Reconstructed core product engine into modular, zero-runtime-dependency TypeScript CLI.
- Updated `package.json` package name to `@naresh007/project-structure-generator` with canonical binary `structgen`.
- Target Node.js support updated to Node.js >= 22 (tested on Node 22 & 24 LTS).

## [0.1.2] - 2026-08-05

### Added
- Minimal engine prototype release.
