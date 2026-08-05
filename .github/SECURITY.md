# Security Policy

## Reporting a Vulnerability

If you discover a potential security issue in Project Structure Generator (`structgen`), please report it privately before opening a public GitHub issue.

Please send security reports to the maintainer via GitHub or email.

## Security Guarantees

Project Structure Generator enforces strict safety constraints:

- Path traversal protection (all paths must stay inside the target output directory)
- Symlink protections (writes through symlink ancestors are rejected)
- Overwrite protections (existing files are never overwritten without explicit `--force`)
- Secret detection during project capture
- Zero executable arbitrary shell hooks in blueprints

For detailed threat models and controls, please see [docs/SECURITY.md](../docs/SECURITY.md).
