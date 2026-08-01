# Aivon Organization Example

This directory demonstrates the intended organization workflow.

From this directory:

```bash
structgen create --output ./generated-service \
  --set projectName=memory-runtime \
  --interactive=false
```

The configuration selects `aivon-python-service`, so developers choose only the service-specific values. The architecture and common options stay fixed in version-controlled files.
