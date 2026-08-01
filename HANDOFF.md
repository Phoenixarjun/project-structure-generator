# Engineering Handoff

## Current state

The repository contains a working version `0.1.0` implementation. It compiles and all 13 automated tests pass.

Implemented commands:

```text
list
show
create
validate
vault init
vault capture
vault import
vault remove
doctor
```

## Core decisions that should not be casually changed

1. The canonical manifest format is JSON.
2. Template contents stay as normal files beside the manifest.
3. Vaults are filesystem directories with deterministic precedence.
4. The engine remains language-neutral.
5. Runtime dependencies remain zero unless there is a strong reason.
6. Blueprints cannot execute arbitrary commands.
7. Existing files are protected unless `--force` is explicit.
8. The initial sharing mechanism is Git, not a hosted registry.

## Most valuable next implementation

Implement blueprint composition without introducing inheritance ambiguity.

Recommended model:

```json
{
  "extends": [
    "fragments/base-service@1",
    "fragments/docker@1",
    "fragments/github-actions@1"
  ]
}
```

Requirements:

- cycle detection
- deterministic merge order
- duplicate output conflict detection
- variable compatibility checks
- explicit override syntax
- no hidden mutation of parent blueprints
- provenance showing every composed blueprint

## Known gaps

- interactive prompts fail immediately on invalid input instead of retrying
- no `.structgenignore`
- capture stores source bodies under numbered files, which is safe but less human-friendly
- no blueprint update or diff operation
- no Windows-specific tests
- no package lock is included in this generated handoff
- published npm name availability must be verified before release

## Validation performed

- TypeScript compilation
- unit tests for interpolation and validation
- registry precedence test
- generation and collision integration tests
- capture and secret-failure cleanup integration tests
- symlink, hierarchy-conflict, and vault-removal safety tests
- organization configuration and interpolated-output integration test
- manual CLI listing
- manual FastAPI dry-run generation

## Suggested audit order

1. filesystem and symlink safety
2. blueprint capture secret handling
3. exact CLI argument edge cases
4. Windows path behavior
5. npm packaging contents
6. blueprint composition design
