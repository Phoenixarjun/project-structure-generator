# Profile Specification

Profiles are versioned JSON manifests that capture complete, reusable project generation selections.

## Manifest Schema (`profile.json`)

```json
{
  "$schema": "../../schema/profile.schema.json",
  "schemaVersion": 1,
  "id": "aivon-python-service",
  "name": "Aivon Python Service",
  "description": "Standard Python FastAPI feature modular service profile",
  "selection": {
    "projectType": "backend-service",
    "language": "python",
    "framework": "fastapi",
    "blueprint": "python-fastapi-feature-modular",
    "maturity": "operational",
    "capabilities": [
      "unit-tests",
      "docker",
      "github-actions",
      "structured-logging",
      "opentelemetry"
    ]
  },
  "variables": {
    "sourceLayout": "src"
  },
  "output": "{{projectName}}"
}
```

## Security Rules

- Profiles MUST NEVER contain secret variable names (`password`, `secret`, `token`, `key`, `credential`, `auth`, `bearer`, `private`).
- Profile output paths MUST be relative template strings, never absolute system paths.
- Profile deletion enforces strict vault root boundary checks.
