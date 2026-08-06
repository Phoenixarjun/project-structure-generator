# Capability Pack Specification

Capability packs are modular, reusable additions that contribute files, directories, or code extension blocks to base blueprints.

## Manifest Schema (`pack.json`)

```json
{
  "$schema": "../../schema/pack.schema.json",
  "schemaVersion": 1,
  "id": "opentelemetry",
  "name": "OpenTelemetry Tracing",
  "category": "observability",
  "description": "Adds OpenTelemetry tracing instrumentation.",
  "compatibleWith": {
    "projectTypes": ["backend-service", "worker"],
    "languages": ["python", "java", "typescript"]
  },
  "conflictsWith": [],
  "requires": [],
  "contributions": [
    {
      "extensionPointId": "application-imports",
      "content": "import logging"
    },
    {
      "extensionPointId": "application-bootstrap",
      "content": "logging.info('OpenTelemetry initialized')"
    }
  ]
}
```

## Extension Point Code Insertion

Base blueprints declare explicit extension point tokens in target files:
- `/* {{EXTENSION_POINT:application-imports}} */`
- `// {{EXTENSION_POINT:application-imports}}`
- `# {{EXTENSION_POINT:application-imports}}`

When a pack defines a contribution targeting `application-imports`, the composition engine inserts the block above the marker without AST modification or arbitrary shell script execution.
