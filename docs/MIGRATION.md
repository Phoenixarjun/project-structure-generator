# Migration Guide

## Migrating from Minimal Engine (v0.1.x) to v0.2.0

Project Structure Generator v0.2.0 introduces the complete Version-One Template Catalogue, structured capability packs, profile management, and catalogue matrix tools.

### Executable Command Compatibility

- The primary binary command is `structgen`.
- Executable alias `project-structure-generator` remains fully supported.

### Blueprint ID Mapping & Status

| Old Command | New Command | Status | Notes |
|---|---|---|---|
| `structgen create typescript-cli-modular ./out` | `structgen create typescript-cli-modular ./out` | Active | Fully compatible |
| `structgen create python-fastapi-clean ./out` | `structgen create python-fastapi-layered ./out` | Active | `python-fastapi-native` / `python-fastapi-layered` |
| `structgen create java-spring-layered ./out` | `structgen create java-spring-layered ./out` | Active | Layered Gradle Spring Boot 3.x |
| `structgen create java-spring-feature-modular ./out` | `structgen create java-spring-package-by-feature ./out` | Active | Package-by-feature structure |

### New Catalogue Features

- **Catalogue Matrix**: Run `structgen catalogue matrix` to inspect all 23 available base blueprints and maturity levels.
- **Profiles**: Run `structgen profile list` to view pre-configured composition starter profiles.
- **Capability Packs**: Pass `--capability docker`, `--capability postgres`, `--capability github-actions` to compose additive infrastructure and testing modules.
