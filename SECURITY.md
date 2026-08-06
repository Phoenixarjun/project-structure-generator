# Security Policy

## Security Guarantees

Project Structure Generator is built with security boundaries enforced at the filesystem and execution layer:

1. **Path Traversal Containment**: All output file paths are validated to ensure they cannot escape the target output directory root (`../` escape prevention).
2. **Symlink Safety**: File writes through symlinked output roots or intermediate symlinked ancestors are strictly rejected.
3. **No Arbitrary Execution**: Blueprints, capability packs, and profiles are purely declarative JSON and template files. The generator never executes shell hooks, scripts, or remote network calls during template rendering.
4. **Secret Detection**: Project capture automatically detects API keys, private keys, database URLs containing passwords, `.env` files, and tokens, aborting capture unless explicitly overridden with `--allow-sensitive`.
5. **Secret Redaction**: Variables declared as `sensitive` are automatically redacted in `.structgen.json` provenance files.
6. **Windows Reserved Name Protection**: Paths containing Windows reserved device names (`CON`, `PRN`, `AUX`, `NUL`, `COM1`..`COM9`, `LPT1`..`LPT9`), trailing dots, or trailing spaces are rejected.

## Reporting a Vulnerability

If you discover a potential security issue in `project-structure-generator`, please report it by opening a security advisory or emailing the maintainer. Please do not report security vulnerabilities through public GitHub issues.
