# CLI Reference

The canonical CLI binary is `structgen`. An executable alias `project-structure-generator` is also available.

## Command Reference

### Generation Commands

- `structgen create [blueprint-id] [output] [options]`
  - `--quick`: Skip wizard and apply default maturity/packs.
  - `--profile ID`: Use a saved profile from vault.
  - `--project-type TYPE`: `backend-service` | `frontend-application` | `fullstack-application` | `cli` | `library` | `worker`
  - `--language LANG`: `python` | `java` | `go` | `typescript`
  - `--framework FW`: `fastapi` | `flask` | `django` | `spring-boot` | `go-standard-library` | `react` | `nextjs` | `typescript-node`
  - `--maturity MATURITY`: `prototype` | `standard` | `operational`
  - `--capability CAP`: Add capability pack (repeatable)
  - `--feature FEAT`: Add initial feature/module (repeatable)
  - `--set key=value`: Set variable (repeatable)
  - `--preview`: Preview plan summary without generation
  - `--dry-run`: Perform preflight validation without disk writes
  - `--interactive=false`: Disable terminal prompter (deterministic CI mode)
  - `--json`: Output JSON results

- `structgen plan [blueprint-id] [output] [options]`
  - Inspect generation plan and entries without mutating disk. Supports `--json`.

### Profile Commands

- `structgen profile list [--json]`
- `structgen profile show <profile-id> [--json]`
- `structgen profile validate <profile-id>`
- `structgen profile remove <profile-id> --yes`

### Vault Commands

- `structgen vault list [--type blueprint|pack|profile] [--json]`
- `structgen vault inspect <id> [--json]`
- `structgen vault init [--scope workspace|user|PATH]`
- `structgen vault capture <source-dir> --id ID`
- `structgen vault import <blueprint-dir>`
- `structgen vault remove <id> --yes`
- `structgen vault validate`

### System Commands

- `structgen list [--json]`
- `structgen show <preset-id> [--json]`
- `structgen validate <blueprint-directory> [--json]`
- `structgen doctor [--json]`
