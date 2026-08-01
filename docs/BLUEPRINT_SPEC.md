# Blueprint Specification v1

## Directory contract

```text
blueprint-directory/
├── blueprint.json
└── template/
    └── arbitrary files
```

`blueprint.json` is mandatory. The template directory name is conventional, not mandatory. Every file source is relative to the blueprint directory.

## Required manifest fields

| Field | Meaning |
|---|---|
| `schemaVersion` | Must be `1` |
| `id` | Stable lowercase identifier |
| `version` | Semantic version |
| `name` | Human-readable name |
| `description` | Human-readable purpose |
| `variables` | Input and derived values |
| `entries` | Directories and files to generate |

## Variables

Supported types:

- `string`
- `boolean`
- `select`

Supported transforms:

- `identity`
- `kebab`
- `snake`
- `camel`
- `pascal`
- `constant`
- `java-package`
- `java-path`

Variables are resolved in declaration order. A default can reference variables already resolved earlier.

```json
{
  "name": "packageName",
  "prompt": "Python package name",
  "type": "string",
  "default": "{{projectName}}",
  "transform": "snake"
}
```

Set `internal` to `true` for a derived value that must never prompt the user. Internal variables require a resolvable default.

Set `sensitive` to `true` to redact the value from generation metadata.

## Directory entry

```json
{
  "type": "directory",
  "path": "src/{{packageName}}/domain"
}
```

## Inline file entry

```json
{
  "type": "file",
  "path": "src/{{packageName}}/__init__.py",
  "content": ""
}
```

## Source file entry

```json
{
  "type": "file",
  "path": "README.md",
  "source": "template/README.md"
}
```

Source files are treated as UTF-8 templates when possible. Set `template` to `false` for binary files or text that must remain literal.

## Conditional entry

```json
{
  "type": "file",
  "path": "Dockerfile",
  "source": "template/Dockerfile",
  "when": {
    "variable": "includeDocker",
    "equals": true
  }
}
```

Exactly one predicate is allowed:

- `equals`
- `notEquals`
- `exists`

## File mode

Use a decimal permission value. `493` is octal `0755`.

```json
{
  "type": "file",
  "path": "bin/start",
  "source": "template/bin/start",
  "mode": 493
}
```

## Template token syntax

```text
{{variableName}}
```

Tokens are supported in paths, inline content, and UTF-8 source files.

## Validation rules

- IDs and variable names must match their documented patterns
- versions must use semantic version syntax
- paths must be relative and cannot contain parent traversal
- entry output paths must be unique before interpolation
- output paths must also remain unique after interpolation
- each file must define exactly one of `source` or `content`
- every referenced variable must be declared
- source files must exist and remain inside the blueprint directory

The formal schema is `schema/blueprint.schema.json`.
