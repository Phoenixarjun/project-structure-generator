# Contributing to Project Structure Generator

Thank you for your interest in contributing!

## Development Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/PhoenixArjun/project-structure-generator.git
   cd project-structure-generator
   ```

2. Install dependencies:
   ```bash
   npm ci
   ```

3. Type-check and run tests:
   ```bash
   npm run typecheck
   npm test
   ```

4. Validate the template catalogue:
   ```bash
   node dist/src/cli.js catalogue validate
   ```

## Architectural Invariants

- **No AI / DB / Web UI / Shell Hooks**: Keep runtime dependencies at zero.
- **Declarative Blueprints**: Blueprints and capability packs define structure and files declaratively without arbitrary shell script execution.
- **Safety First**: Preserve path traversal prevention, symlink safety, overwrite protection, and secret redaction.
- **No Comments in Code**: Follow code quality standards without unnecessary inline comment noise.

## Submitting Pull Requests

- Create a feature branch off `dev`.
- Ensure all tests pass (`npm test`).
- Ensure package contents check passes (`npm run package:check`).
- Submit a PR targeting `dev`.
