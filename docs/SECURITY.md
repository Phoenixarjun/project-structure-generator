# Security Model

## Threats considered

- blueprint paths escaping the selected output directory
- source paths reading files outside a blueprint
- overwriting existing source code unexpectedly
- writing through symlinks into unrelated filesystem locations
- capturing credentials into reusable templates
- executing untrusted template code during generation
- leaking sensitive variable values into metadata

## Controls

### Path containment

All generated and source paths are normalized, required to be relative, and resolved under an explicit root. Parent traversal and absolute paths are rejected.

### Collision safety

Existing files cause generation to fail unless `--force` is explicitly passed.

### Symlink safety

The writer rejects destination symlinks and symlink ancestors before writing files.

### Capture safety

Capture excludes common dependency, source-control, build, environment, and key files. UTF-8 text is scanned for common private-key, cloud-key, token, and credential patterns. Capture and import are staged and moved into place only after successful completion.

### No executable hooks

Version 1 never runs commands declared by a blueprint. Templates are data.

### Metadata redaction

Variables marked `sensitive` are written as `[REDACTED]` in `.structgen.json`.

## Known limitations

Pattern-based secret detection cannot prove that captured content is safe. Every captured blueprint must be reviewed before it is committed or shared.

`--force` can overwrite files by design. Use dry-run in unfamiliar repositories.

Remote vault download, signature verification, checksums, and trust policies are not implemented in version 1.

## Reporting

Report security issues privately to the repository owner before creating a public issue.
