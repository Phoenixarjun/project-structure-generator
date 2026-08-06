# Extending the Catalogue

Organizations can extend the built-in catalogue by creating custom blueprints, capability packs, and profiles in a workspace or user vault.

## Vault Layout

```text
.structgen/
└── vault/
    ├── blueprints/
    │   └── my-custom-blueprint/
    │       ├── blueprint.json
    │       └── template/
    ├── packs/
    └── profiles/
```

## Adding a Custom Blueprint

1. Create a directory inside `.structgen/vault/blueprints/`.
2. Add `blueprint.json` defining variables, entries, and metadata.
3. Add template files inside `template/`.
4. Validate with `structgen validate .structgen/vault/blueprints/my-custom-blueprint`.
