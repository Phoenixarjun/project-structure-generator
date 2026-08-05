# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-06

### Added

- Language-neutral deterministic project scaffolding CLI (`structgen`).
- Built-in blueprints:
  - `typescript-cli-modular`
  - `python-fastapi-clean`
  - `java-spring-layered`
  - `java-spring-feature-modular` (with included Gradle wrapper files)
- Blueprint vault model (explicit, config-declared, workspace, user, and built-in vaults).
- Blueprint capture (`structgen vault capture`) with secret scanning and variable detection.
- Provenance metadata via `.structgen.json`.
- Strict path traversal, symlink, overwrite, and hierarchy safety guarantees.
- Comprehensive CLI commands: `list`, `show`, `create`, `validate`, `vault init`, `vault capture`, `vault import`, `vault remove`, `doctor`.
- Cross-platform filesystem support and automated smoke testing suite.
