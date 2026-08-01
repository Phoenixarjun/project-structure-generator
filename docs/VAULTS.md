# Vaults

## What a vault is

A vault is a directory of reusable blueprints. It is not a database, service, package registry, or hidden binary format.

This allows a vault to be:

- committed beside an application
- stored in a dedicated Git repository
- copied between machines
- reviewed through pull requests
- versioned through normal Git tags

## Built-in vault

The npm package ships a small built-in vault under `presets/builtin`.

## User vault

Default location:

```text
~/.structgen/vault
```

Override the home directory with `STRUCTGEN_HOME`.

## Workspace vault

Default location:

```text
<current-directory>/.structgen/vault
```

For an organization, commit the workspace vault and `structgen.config.json`.

## Configuration vaults

A repository can reference additional relative or absolute vault paths:

```json
{
  "vaults": [
    ".structgen/vault",
    "../engineering-blueprints"
  ],
  "defaultPreset": "company-fastapi",
  "variables": {
    "includeDocker": true
  }
}
```

Relative paths resolve from the configuration file directory.

## Organization workflow

1. Build one approved service manually.
2. Remove credentials, generated output, and project-specific data.
3. Capture it into a workspace or shared vault.
4. Review `blueprint.json` and all captured template files.
5. Commit the vault.
6. Configure `defaultPreset` and stable variables.
7. Generate every new service through the same preset.
8. Change the blueprint version when the standard evolves.

## Overriding built-ins

An organization can define a blueprint with ID `python-fastapi-clean`. Because workspace and config vaults take precedence over built-ins, normal commands automatically use the organization version.

Use distinct IDs when both versions should remain available.

## Sharing through Git

The recommended initial sharing model is a Git repository, not a custom remote marketplace.

```text
engineering-blueprints/
├── python-fastapi-clean/
├── java-spring-layered/
└── README.md
```

Reference it from `structgen.config.json`, use a Git submodule, or import selected blueprints into the workspace vault.

## Why no central database

A database would add identity, availability, migration, backup, and deployment problems to a utility whose core data is a small set of reviewable files. Filesystem vaults are the correct first abstraction.
