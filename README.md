# Project Structure Generator

A deterministic TypeScript CLI for generating consistent project structures from reusable filesystem-based blueprints.

The package is intentionally not an AI system and not a general-purpose code generator. Its job is to remove repeated structural decisions, preserve organization-level conventions, and make approved skeletons reusable across repositories.

> **Target vs Runtime Note**: Python, Java, Go, React, Next.js, and TypeScript are supported generation targets. The `structgen` CLI itself is written entirely in TypeScript and runs on Node.js with zero runtime dependencies.

## Features

- **Version-One Template Catalogue**: 23 base blueprints across Python, Java, Go, React, Next.js, and TypeScript CLI.
- **14 Compatible Capability Packs**: Additive infra, testing, database, and CI scaffolding (`docker`, `postgres`, `redis`, `opentelemetry`, `github-actions`, etc.).
- **5 Built-In Profiles**: Fast starter selections (`aivon-python-service`, `spring-modular-service`, `go-operational-service`, `nextjs-standard-application`, `typescript-cli-tool`).
- **3 Maturity Levels**: Explicit readiness recommendations (`prototype`, `standard`, `operational`).
- **Filesystem Vaults**: Hierarchical precedence (explicit `--vault` > `structgen.config.json` > workspace vault > user vault > built-in presets).
- **Atomic Capture**: Capture existing project trees into reusable blueprints with automatic secret detection.
- **Safety by Default**: Path traversal prevention, symlink safety, overwrite protection, and zero arbitrary shell hooks.
- **Deterministic & CI Friendly**: Dry-run generation preview, explicit variable setting, catalogue validation matrix, and structured JSON output.

## Node.js Support Policy

- **Node.js**: `>= 22.0.0` (Tested on Node.js 24 LTS)
- **Zero Runtime Dependencies**

## Installation & Usage

Run directly without installation:

```bash
npx @naresh007/project-structure-generator create python-fastapi-native ./my-service \
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

### 1. View Catalogue Matrix

```bash
structgen catalogue matrix
```

Outputs the full support matrix of all 23 base blueprints, project types, languages, frameworks, and default maturity levels. Output as JSON with `--json`:

```bash
structgen catalogue matrix --json
```

### 2. Validate Vault & Catalogue

```bash
structgen catalogue validate
```

Validates all blueprints, capability packs, profiles, variable defaults, and template file references on disk.

### 3. Generate a Project from Catalogue

Generate a Python FastAPI layered service non-interactively:

```bash
structgen create python-fastapi-layered ./services/billing \
  --set projectName=billing-service \
  --interactive=false
```

Generate a Java Spring Boot Modular Monolith service:

```bash
structgen create java-spring-modular-monolith ./services/orders \
  --set projectName=orders-service \
  --dry-run \
  --interactive=false
```

Generate a Go Domain-Modular operational service:

```bash
structgen create go-domain-modular ./services/inventory \
  --set projectName=inventory-service \
  --interactive=false
```

### 4. Inspect a Blueprint

```bash
structgen show python-fastapi-native
```

### 5. Validate a Custom Blueprint

```bash
structgen validate ./.structgen/vault/blueprints/company-fastapi
```

## Version-One Catalogue Matrix

| ID | Project Type | Language | Framework | Organization | Default Maturity |
|---|---|---|---|---|---|
| `python-fastapi-native` | backend-service | python | fastapi | native | prototype |
| `python-fastapi-layered` | backend-service | python | fastapi | layered | standard |
| `python-fastapi-feature-modular` | backend-service | python | fastapi | feature-modular | standard |
| `python-flask-blueprint-native` | backend-service | python | flask | blueprint-native | standard |
| `python-flask-layered` | backend-service | python | flask | layered | standard |
| `python-flask-feature-modular` | backend-service | python | flask | feature-modular | operational |
| `python-django-apps` | backend-service | python | django | apps | standard |
| `python-django-domain-apps` | backend-service | python | django | domain-apps | standard |
| `python-django-modular-apps` | backend-service | python | django | modular-apps | operational |
| `java-spring-layered` | backend-service | java | spring-boot | layered | standard |
| `java-spring-package-by-feature` | backend-service | java | spring-boot | package-by-feature | standard |
| `java-spring-modular-monolith` | backend-service | java | spring-boot | modular-monolith | operational |
| `go-minimal` | backend-service | go | go-standard-library | minimal | prototype |
| `go-command-internal` | backend-service | go | go-standard-library | command-internal | standard |
| `go-domain-modular` | backend-service | go | go-standard-library | domain-modular | operational |
| `react-simple` | frontend-application | typescript | react | simple | standard |
| `react-feature-based` | frontend-application | typescript | react | feature-based | operational |
| `nextjs-app-router-native` | frontend-application | typescript | nextjs | app-router-native | standard |
| `nextjs-route-colocated` | frontend-application | typescript | nextjs | route-colocated | standard |
| `nextjs-feature-modular` | frontend-application | typescript | nextjs | feature-modular | standard |
| `typescript-cli-minimal` | cli | typescript | typescript-node | minimal | prototype |
| `typescript-cli-command-oriented` | cli | typescript | typescript-node | command-oriented | standard |
| `typescript-cli-modular` | cli | typescript | typescript-node | modular | operational |

## Vault Model & Precedence

A vault is a filesystem directory containing `blueprints/`, `packs/`, and `profiles/`:

```text
.structgen/
└── vault/
    ├── blueprints/
    │   └── company-fastapi/
    │       ├── blueprint.json
    │       └── template/
    ├── packs/
    └── profiles/
```

Blueprint precedence is strictly deterministic:

1. Explicit `--vault PATH` flags passed on the CLI
2. Vault paths declared in `structgen.config.json`
3. Current workspace vault (`.structgen/vault`)
4. User vault (`~/.structgen/vault`)
5. Built-in presets (`presets/builtin`)

Higher-precedence blueprints override lower-precedence blueprints with matching IDs.

## Workspace & Organization Configuration

Initialize a workspace vault and `structgen.config.json`:

```bash
structgen vault init --scope workspace --default-preset python-fastapi-layered
```

Example `structgen.config.json`:

```json
{
  "vaults": [".structgen/vault"],
  "defaultPreset": "python-fastapi-layered",
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
structgen create python-fastapi-layered ./billing \
  --set projectName=billing \
  --set includeDocker=true \
  --interactive=false \
  --json
```

Output when `--json` is active:

```json
{
  "blueprint": "python-fastapi-layered",
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
- **No Hook Execution**: Blueprints and capability packs cannot run arbitrary shell commands.
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
