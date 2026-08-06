# Troubleshooting Guide

## Common Diagnostics

Run `structgen doctor` to inspect environment, vault resolution, permissions, and catalogue validity.

### 1. `NON_INTERACTIVE` Error
- **Cause**: Interactive input attempted in non-TTY terminal environment.
- **Solution**: Pass `--interactive=false` and provide all variables via `--set key=value`.

### 2. `FILE_EXISTS` Error
- **Cause**: Target directory contains existing files that would be overwritten.
- **Solution**: Pass `--force` or specify an empty target directory.

### 3. `SECRET_DETECTED` Error
- **Cause**: `structgen vault capture` detected potential credentials or secret keys in source text.
- **Solution**: Remove secrets from source files or pass `--allow-sensitive` if verified safe.

### 4. `UNSAFE_PATH` Error
- **Cause**: Blueprint entry path attempted parent directory escape (`../`) or used reserved Windows filenames (`CON`, `NUL`).
- **Solution**: Ensure all paths remain relative within target root without escaping.
