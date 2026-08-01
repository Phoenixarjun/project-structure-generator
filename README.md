# Project Structure Generator

A deterministic CLI for generating consistent project structures from reusable filesystem-based blueprints.

The package is intentionally not an AI system and not a general-purpose code generator. Its job is to remove repeated structural decisions, preserve organization-level conventions, and make the same approved skeleton reusable across repositories.

## Why this exists

Framework starters solve dependency selection. Generic template engines require every team to invent its own conventions. Project Structure Generator sits between them:

- curated built-in structures provide immediate value
- workspace vaults let a repository or organization override those structures
- user vaults preserve personal templates across projects
- captured projects can become reusable blueprints
- generation is deterministic, inspectable, and safe by default

## Runtime

- Node.js 24 LTS
- npm 11
- TypeScript 6 for development
- zero runtime dependencies

## Install

```bash
npm install --global @naresh007/project-structure-generator
```

During local development:

```bash
npm install
npm run build
node dist/src/cli.js list
```

## Quick start

List available structures:

```bash
structgen list
```

Generate a FastAPI service without interactive questions:

```bash
structgen create python-fastapi-clean ./billing-runtime \
  --set projectName=billing-runtime \
  --interactive=false
```

Preview without writing:

```bash
structgen create java-spring-layered ./orders \
  --set projectName=orders \
  --dry-run \
  --interactive=false
```

Inspect a preset:

```bash
structgen show python-fastapi-clean
```

Validate a custom blueprint:

```bash
structgen validate ./.structgen/vault/company-fastapi
```

## Vault model

A vault is an ordinary directory containing one or more blueprint directories.

```text
.structgen/
└── vault/
    └── company-fastapi/
        ├── blueprint.json
        └── template/
            ├── pyproject.toml
            └── src/
```

Blueprint precedence is deterministic:

1. paths passed with `--vault`
2. vault paths declared in `structgen.config.json`
3. the current workspace vault
4. the user vault
5. built-in presets

A higher-precedence blueprint can reuse the same ID to override a lower-precedence blueprint. This is how an organization can replace `python-fastapi-clean` with its approved internal structure without changing developer commands.

## Initialize an organization workspace

```bash
structgen vault init --scope workspace --default-preset company-fastapi
```

This creates:

```text
structgen.config.json
.structgen/vault/
```

Commit both to Git. Every repository using that configuration resolves the same template.

Example configuration:

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

## Capture an existing project

Turn a known-good project into a reusable blueprint:

```bash
structgen vault capture ./billing-runtime \
  --id company-fastapi \
  --name "Company FastAPI Service" \
  --scope workspace
```

By default, the source directory name becomes `{{projectName}}` inside captured paths and UTF-8 files.

Add explicit replacements:

```bash
structgen vault capture ./billing-runtime \
  --id company-fastapi \
  --replace billing-runtime=projectName:kebab \
  --replace billing_runtime=packageName:snake \
  --scope workspace
```

Capture excludes source-control metadata, dependency directories, build output, virtual environments, local environment files, private keys, and common secret-bearing files. Potential secrets found in text content stop capture unless `--allow-sensitive` is passed intentionally.

## Import a blueprint

```bash
structgen vault import ../shared-blueprints/company-fastapi --scope workspace
```

## Remove a blueprint

```bash
structgen vault remove company-fastapi --scope workspace --yes
```

## Built-in presets

| ID | Purpose |
|---|---|
| `typescript-cli-modular` | Dependency-light modular TypeScript CLI |
| `python-fastapi-clean` | FastAPI service with API, application, domain, infrastructure, observability, and shared boundaries |
| `java-spring-layered` | Conventional Spring Boot controller/DTO/model/repository/service/implementation structure |
| `java-spring-feature-modular` | Feature-oriented Spring Boot modular-monolith starting point |

## Blueprint format

Every blueprint uses `blueprint.json` as its machine-readable contract. Template bodies remain ordinary files.

```json
{
  "schemaVersion": 1,
  "id": "company-fastapi",
  "version": "1.0.0",
  "name": "Company FastAPI Service",
  "description": "Approved service skeleton",
  "variables": [
    {
      "name": "projectName",
      "prompt": "Project name",
      "type": "string",
      "required": true,
      "transform": "kebab"
    },
    {
      "name": "packageName",
      "prompt": "Python package name",
      "type": "string",
      "default": "{{projectName}}",
      "transform": "snake"
    }
  ],
  "entries": [
    {
      "type": "directory",
      "path": "src/{{packageName}}"
    },
    {
      "type": "file",
      "path": "README.md",
      "source": "template/README.md"
    }
  ]
}
```

The JSON Schema is available at `schema/blueprint.schema.json`.

## Safety guarantees

- generated paths cannot be absolute or escape the target directory
- template sources cannot escape their blueprint directory
- existing files are never overwritten without `--force`
- generation refuses to write through symlink ancestors
- captured files have a configurable size limit
- capture scans text for common secret patterns
- executable permissions are preserved
- sensitive variables are redacted from `.structgen.json`
- arbitrary post-generation hooks are deliberately unsupported in version 1

## Commands

```text
structgen list
structgen show <preset-id>
structgen create [preset-id] [output]
structgen validate <blueprint-directory>
structgen vault init
structgen vault capture <source-directory>
structgen vault import <blueprint-directory>
structgen vault remove <preset-id>
structgen doctor
```

Run `structgen help` for flags.

## Development

```bash
npm install
npm run typecheck
npm test
```

## Project documents

- `docs/ARCHITECTURE.md`
- `docs/BLUEPRINT_SPEC.md`
- `docs/VAULTS.md`
- `docs/SECURITY.md`
- `docs/ROADMAP.md`
- `HANDOFF.md`
- `AGENTS.md`

## Status

Version `0.1.0` is a functional foundation. It supports deterministic generation, built-in and custom vaults, atomic blueprint capture and import, removal, validation, dry runs, configuration defaults, output interpolation, and a programmatic API.
