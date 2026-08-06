# Manual Release Guide & Checklist

This document details the exact owner steps required to publish `@naresh007/project-structure-generator` to public npm.

## Pre-Release Prerequisites (Owner One-Time Setup)

1. Verify npm account `naresh007` exists and has access to publish scope `@naresh007`.
2. Enable 2FA on your npm account.
3. Configure npm Trusted Publisher via npm package settings:
   - GitHub Owner: `PhoenixArjun`
   - Repository: `project-structure-generator`
   - Workflow filename: `release.yml`

## Release Checklist

1. **Verify Local Quality & Build**:
   ```bash
   npm ci
   npm run typecheck
   npm test
   npm run package:check
   node dist/src/cli.js catalogue validate
   ```

2. **Verify Version in package.json**:
   Ensure `package.json` specifies `"version": "0.2.0"`.

3. **Verify CHANGELOG.md**:
   Ensure release notes for `[0.2.0]` are updated.

4. **Merge Feature Branch to Dev & Main**:
   - Merge `feature/production-hardening-0.1.0` into `dev`.
   - Merge `dev` into `main`.

5. **Create Tag & Push**:
   ```bash
   git checkout main
   git pull origin main
   git tag -a v0.2.0 -m "Release v0.2.0"
   git push origin v0.2.0
   ```

6. **Monitor GitHub Actions**:
   Observe the `Release` workflow in GitHub Actions. It will verify test coverage, catalogue validity, package contents, build, and publish to public npm with OIDC provenance.

7. **Post-Release Smoke Test**:
   ```bash
   npx @naresh007/project-structure-generator@0.2.0 --version
   npx @naresh007/project-structure-generator@0.2.0 doctor
   ```
