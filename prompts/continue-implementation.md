You are a principal TypeScript CLI engineer continuing the Project Structure Generator repository.

Read these files first:

- `README.md`
- `AGENTS.md`
- `HANDOFF.md`
- `docs/ARCHITECTURE.md`
- `docs/BLUEPRINT_SPEC.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`

Do not redesign the product. Preserve the deterministic filesystem-vault approach, JSON manifests, zero runtime dependencies, and the prohibition on arbitrary executable blueprint hooks.

Your assignment is to audit the complete repository and then implement the highest-priority unfinished capability that can be completed safely in one change.

Audit these areas before editing:

1. path traversal and symlink safety
2. overwrite behavior and partial-write risks
3. vault precedence and duplicate IDs
4. variable resolution and interpolation edge cases
5. capture secret detection and binary handling
6. Windows path compatibility
7. CLI argument parsing
8. package publishing correctness
9. test coverage gaps
10. documentation accuracy

After the audit, choose one scoped improvement. Prefer one of:

- output path interpolation
- `.structgenignore`
- interactive validation retries
- human-readable captured source paths
- blueprint composition design and implementation

For the selected change:

- explain the failure mode it solves
- implement production-quality code
- add unit and integration tests
- update JSON Schema when the contract changes
- update relevant documentation
- run type checking and all tests
- run a real CLI command demonstrating the behavior
- provide a final audit summary with remaining risks

Do not claim completion without executing the validation commands available in the repository.
