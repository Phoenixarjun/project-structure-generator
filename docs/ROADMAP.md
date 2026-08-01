# Roadmap

## Version 0.1

Completed:

- TypeScript CLI with zero runtime dependencies
- built-in, workspace, user, config, and explicit vault discovery
- deterministic precedence and override behavior
- JSON blueprint validation
- string, boolean, and select variables
- naming transforms and derived defaults
- conditional entries
- dry-run and conflict protection
- symlink and path traversal protection
- blueprint capture, import, and removal
- secret-aware capture
- provenance metadata
- programmatic API
- built-in TypeScript, Python, and Java structures
- automated tests and CI

## Version 0.2

Recommended next work:

- blueprint composition through `extends`
- reusable fragments for Docker, CI, observability, and test layouts
- `structgen diff` between an existing project and a blueprint
- richer capture replacement rules
- `.structgenignore`
- improved interactive selection and validation loops
- Windows integration tests

## Version 0.3

- update an existing generated project from a newer blueprint version
- blueprint migration declarations without arbitrary shell hooks
- checksums and provenance for imported blueprints
- signed remote Git vault references
- organization policy file for approved blueprint IDs and versions

## Future research

- architecture-boundary validation as a separate command
- language adapters for import graph analysis
- a read-only web catalogue for public blueprints
- optional AI-assisted blueprint recommendation only after deterministic selection is mature

## Explicit non-goals

- replacing Spring Initializr, Vite, Nx, Cookiecutter, or Copier
- generating complete production business logic
- owning package installation
- executing arbitrary post-generation scripts
- building a hosted marketplace before local and Git-based workflows are proven
