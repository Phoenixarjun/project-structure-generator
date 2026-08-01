# Agent Instructions

You are extending Project Structure Generator, a deterministic TypeScript CLI.

## Product intent

Remove repeated project-structure decisions and preserve reusable organization conventions. Do not turn the project into an AI platform or generic application generator.

## Required boundaries

- preserve the filesystem vault model
- preserve JSON as the canonical manifest
- keep template contents as ordinary files
- keep language knowledge inside blueprints when possible
- keep runtime dependencies at zero unless justified with measurable complexity reduction
- never add arbitrary shell hooks to blueprints
- never weaken path traversal, overwrite, symlink, capture, or secret protections
- keep non-interactive commands deterministic
- maintain Node.js 24 LTS compatibility

## Implementation workflow

1. Read `README.md`, `docs/ARCHITECTURE.md`, `docs/BLUEPRINT_SPEC.md`, and `HANDOFF.md`.
2. State the exact behavior being changed.
3. Add or update tests before considering the task complete.
4. Run TypeScript type checking and all tests.
5. Test at least one real CLI command for user-visible changes.
6. Update documentation and the JSON Schema when contracts change.

## Code quality

- use focused modules
- return typed domain values
- use `StructgenError` for expected failures
- avoid hidden global state
- keep filesystem writes behind preflight validation
- do not duplicate blueprint parsing rules
- use explicit names rather than abbreviations
- no source file should become a catch-all module

## Completion criteria

A change is complete only when behavior, tests, documentation, safety impact, and backward compatibility are addressed.
