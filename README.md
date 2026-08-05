# Project Structure Generator

A deterministic TypeScript CLI for generating consistent project structures from reusable filesystem-based blueprints.

The package is intentionally not an AI system and not a general-purpose code generator. Its job is to remove repeated structural decisions, preserve organization-level conventions, and make approved skeletons reusable across repositories.

> **Target vs Runtime Note**: Python, Java, and TypeScript are supported generation targets. The `structgen` CLI itself is written entirely in TypeScript and runs on Node.js with zero runtime dependencies.

## Features

- **Built-in presets**: Immediate scaffolding for TypeScript CLI, Python FastAPI (Clean Architecture), and Java Spring Boot (Layered & Modular Monolith).
- **Filesystem vaults**: Hierarchical precedence (explicit `--vault` > `structgen.config.json` > workspace vault > user vault > built-in presets).
- **Atomic capture**: Capture existing project trees into reusable blueprints with automatic secret detection.
- **Safety by default**: Path traversal prevention, symlink safety, overwrite protection, and no arbitrary shell hooks.
- **Deterministic & CI friendly**: Dry-run generation preview, explicit variable setting, and structured JSON output mode.

## Node.js Support Policy

- **Node.js**: `>= 22.0.0` (Tested on Node.js 22.x and 24.x LTS)
- **Zero Runtime Dependencies**

## Installation & Usage

Run directly without installation:

```bash
npx @naresh007/project-structure-generator create python-fastapi-clean ./my-service \
  --set projectName=my-service \
  --interactive=false
```

Install globally via npm:

```bash
npm install --global @naresh007/project-structure-generator
```

Once installed globally:

```bash
structgen list
```

During local development:

```bash
npm ci
npm run build
node dist/src/cli.js list
```

## Quick Start

### 1. List available presets

```bash
structgen list
```

Outputs human-readable preset listing or structured JSON with `--json`:

```bash
structgen list --json
```

### 2. Generate a project

Generate a FastAPI service non-interactively:

```bash
structgen create python-fastapi-clean ./services/billing \
  --set projectName=billing-service \
  --interactive=false
```

Preview changes without writing to disk:

```bash
structgen create java-spring-layered ./services/orders \
  --set projectName=orders \
  --dry-run \
  --interactive=false
```

Overwrite existing files if explicitly intended:

```bash
structgen create typescript-cli-modular ./my-cli \
  --set projectName=my-cli \
  --force \
  --interactive=false
```

### 3. Inspect a blueprint

```bash
structgen show python-fastapi-clean
```

### 4. Validate a custom blueprint

```bash
structgen validate ./.structgen/vault/company-fastapi
```

## Built-In Presets

| ID | Language | Framework | Architecture / Description |
|---|---|---|---|
| `typescript-cli-modular` | TypeScript | Node.js | Dependency-light modular CLI project with build, test, and typecheck tooling |
| `python-fastapi-clean` | Python | FastAPI | Clean Architecture layout (API, application, domain, infrastructure, observability, shared) |
| `java-spring-layered` | Java | Spring Boot | Layered Gradle architecture (controller, dto, model, repository, service, impl) with Gradle wrapper |
| `java-spring-feature-modular` | Java | Spring Boot | Feature-oriented modular-monolith starting point with Gradle wrapper |

## Vault Model & Precedence

A vault is a filesystem directory containing blueprint directories:

```text
.structgen/
└── vault/
    └── company-fastapi/
        ├── blueprint.json
        └── template/
            ├── pyproject.toml
            └── src/
```

Blueprint precedence is strictly deterministic:

1. Explicit `--vault PATH` flags passed on the CLI
2. Vault paths declared in `structgen.config.json`
3. Current workspace vault (`.structgen/vault`)
4. User vault (`~/.structgen/vault`)
5. Built-in presets

Higher-precedence blueprints override lower-precedence blueprints with matching IDs.

## Workspace & Organization Configuration

Initialize a workspace vault and `structgen.config.json`:

```bash
structgen vault init --scope workspace --default-preset company-fastapi
```

Example `structgen.config.json`:

```json
{
  "vaults": [".structgen/vault"],
  "defaultPreset": "company-fastapi",
  "output": "./services/{{projectName}}",
  "variables": {
    "includeDocker": true
  }
}
```

Commit `structgen.config.json` and `.structgen/` to source control so team members inherit identical defaults.

## Project Capture Workflow

Convert an existing project into a reusable blueprint:

```bash
structgen vault capture ./services/billing-runtime \
  --id company-fastapi \
  --name "Company FastAPI Skeleton" \
  --replace billing-runtime=projectName:kebab \
  --replace billing_runtime=packageName:snake \
  --scope workspace
```

Capture automatically filters dependency folders, build output, virtual environments, `.env` files, and private keys. If potential secrets are found, capture stops unless `--allow-sensitive` is supplied.

## Non-Interactive & CI Usage

For automated environments, pass `--interactive=false` and provide all variables via `--set`:

```bash
structgen create python-fastapi-clean ./billing \
  --set projectName=billing \
  --set includeDocker=true \
  --interactive=false \
  --json
```

Output when `--json` is active:

```json
{
  "blueprint": "python-fastapi-clean",
  "targetDirectory": "/workspace/billing",
  "variables": {
    "projectName": "billing",
    "packageName": "billing",
    "includeDocker": true
  },
  "result": {
    "dryRun": false,
    "createdDirectories": [
      "/workspace/billing/src/billing/api"
    ],
    "createdFiles": [
      "/workspace/billing/pyproject.toml"
    ],
    "overwrittenFiles": []
  }
}
```

## Security & Safety Guarantees

- **Path Containment**: Output files cannot write outside the target directory.
- **Symlink Protection**: Filesystem writes through symlinked ancestors are rejected.
- **Overwrite Safety**: Existing files are never replaced without explicit `--force`.
- **No Hook Execution**: Blueprints cannot run arbitrary shell commands during generation.
- **Secret Redaction**: Variables declared as `sensitive` are redacted in `.structgen.json` provenance files.

For details, view [docs/SECURITY.md](docs/SECURITY.md).

## Blueprint Specification

For full syntax rules on `blueprint.json` variable definitions, transforms, conditions, and entry types, refer to the [Blueprint Specification v1](docs/BLUEPRINT_SPEC.md).

## Troubleshooting

- **`NON_INTERACTIVE` Error**: Interactive input was attempted in a non-TTY terminal. Solution: Pass `--interactive=false` and supply variables with `--set key=value`.
- **`FILE_EXISTS` Error**: Output path already contains target files. Solution: Pass `--force` to allow overwriting or choose a clean target directory.
- **`SECRET_DETECTED` Error**: Capture found credential patterns in source text. Solution: Review files to remove secrets, or pass `--allow-sensitive` if verified safe.
- **`PATH_TRAVERSAL` Error**: Blueprint entry or output path attempted parent directory escape (`../`). Solution: Ensure all paths remain relative within target root.

## Development

```bash
npm ci
npm run typecheck
npm test
npm run test:coverage
```

## License

[MIT](LICENSE)
