# Feature Generation

Blueprints supporting feature templates allow generating initial domain features during project creation or subsequently.

## Feature Template Definition

Blueprints declare `featureTemplate` in `blueprint.json`:

```json
{
  "featureTemplate": {
    "directories": [
      { "type": "directory", "path": "src/features/{{featureNameKebab}}" }
    ],
    "files": [
      {
        "type": "file",
        "path": "src/features/{{featureNameKebab}}/routes.py",
        "source": "template/feature/routes.py"
      }
    ]
  }
}
```

## CLI Usage

```bash
structgen create python-fastapi-feature-modular ./my-service \
  --feature billing \
  --feature orders \
  --interactive=false
```
