# Architecture

## Product boundary

Project Structure Generator owns four responsibilities:

1. discover reusable blueprints
2. resolve blueprint variables
3. create a deterministic generation plan
4. safely materialize that plan on the filesystem

It does not own dependency installation, framework-specific business logic, package publishing, AI recommendations, or architecture-rule enforcement.

## Module map

```text
CLI
├── argument parsing
├── terminal prompting
└── output formatting

Commands
├── create
├── list/show
├── validate
├── vault operations
└── doctor

Configuration
└── nearest structgen.config.json

Vault
├── location precedence
├── blueprint discovery
├── capture
└── import/remove

Blueprint
├── loading
├── schema validation
└── source validation

Engine
├── variable resolution
├── transforms
├── conditions
├── interpolation
├── planning
└── safe writing

Core
├── types
├── errors
├── filesystem safety
└── constants
```

## Generation flow

```text
Arguments and config
        ↓
Vault location resolution
        ↓
Blueprint registry construction
        ↓
Preset selection
        ↓
Variable resolution
        ↓
Condition evaluation
        ↓
Path and content interpolation
        ↓
Generation plan
        ↓
Conflict and symlink preflight
        ↓
Filesystem writes
        ↓
.structgen.json provenance metadata
```

## Why JSON plus template files

JSON is the canonical manifest because it is deterministic, easy to validate, language-neutral, and supported without runtime dependencies. Large file contents are not embedded in JSON. They live under the blueprint directory and are referenced through `source`.

This keeps diffs readable and makes organization templates natural Git repositories.

## Vault precedence

Vaults are resolved from most specific to least specific. The first blueprint ID wins.

```text
explicit CLI vaults
        ↓
config-declared vaults
        ↓
workspace vault
        ↓
user vault
        ↓
built-in vault
```

This creates controlled override behavior without a database or registry service.

## Extensibility seams

New languages require blueprint content, not engine changes.

Engine changes should only be required for new cross-language capabilities such as:

- richer conditions
- composition and inheritance
- blueprint migrations
- update mode
- remote signed vaults
- architecture validation

## Deliberate constraints

Version 1 does not execute arbitrary hooks. A downloaded template must not become remote code execution simply because it was generated.

Version 1 also avoids YAML to preserve zero runtime dependencies and eliminate differences between YAML parsers. YAML can be added later as an optional adapter if demand justifies it.
