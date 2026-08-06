# Maturity Levels

Project Structure Generator supports three explicit maturity levels:

## 1. Prototype (`prototype`)
- Minimal scaffolding for proof-of-concept exploration.
- Fast startup, minimum file count, single-file entrypoints where applicable.

## 2. Standard (`standard`)
- Balanced architecture suitable for standard team development.
- Includes unit tests, structured configuration, logging, and package boundaries.

## 3. Operational (`operational`)
- Full production readiness scaffolding.
- Includes integration tests, multi-stage Docker setup, CI workflows, observability extensions, and architectural verification tests.
- Note: Operational adds operational scaffolding. It does not guarantee that the application is production-ready.
