import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, rm, readFile } from "node:fs/promises";
import {
  isSecretVariableName,
  sanitizeProfileVariables,
  saveProfileToVault,
  removeProfileFromVault,
  validateProfileManifest
} from "../src/profile/manager.js";
import type { ProfileManifest, VaultLocation } from "../src/core/types.js";

void test("profile manager detects secret variable names", () => {
  assert.equal(isSecretVariableName("db_password"), true);
  assert.equal(isSecretVariableName("api_secret_key"), true);
  assert.equal(isSecretVariableName("auth_token"), true);
  assert.equal(isSecretVariableName("projectName"), false);
});

void test("profile manager sanitizes secret variables before saving", () => {
  const vars = {
    projectName: "my-service",
    db_password: "super-secret-password",
    api_token: "xyz123"
  };

  const clean = sanitizeProfileVariables(vars);
  assert.equal(clean.projectName, "my-service");
  assert.equal(clean.db_password, undefined);
  assert.equal(clean.api_token, undefined);
});

void test("profile manager validates schemaVersion and forbidden secrets", () => {
  const invalidVersion: ProfileManifest = {
    schemaVersion: 2 as any,
    id: "test-prof",
    name: "Test",
    selection: {
      projectType: "backend-service",
      language: "python",
      framework: "fastapi",
      blueprint: "python-fastapi-feature-modular",
      maturity: "standard",
      capabilities: []
    }
  };

  assert.throws(() => validateProfileManifest(invalidVersion), /unsupported schemaVersion/);

  const secretInProfile: ProfileManifest = {
    schemaVersion: 1,
    id: "test-prof",
    name: "Test",
    selection: {
      projectType: "backend-service",
      language: "python",
      framework: "fastapi",
      blueprint: "python-fastapi-feature-modular",
      maturity: "standard",
      capabilities: []
    },
    variables: {
      app_secret: "1234"
    }
  };

  assert.throws(() => validateProfileManifest(secretInProfile), /forbidden secret variable/);
});

void test("profile manager saves and removes profiles from vault directory", async () => {
  const tmpVault = path.join(process.cwd(), "temp-profile-vault-test");
  await mkdir(path.join(tmpVault, "profiles"), { recursive: true });

  const vault: VaultLocation = { kind: "workspace", path: tmpVault, label: "test" };
  const manifest: ProfileManifest = {
    schemaVersion: 1,
    id: "custom-profile",
    name: "Custom Profile",
    selection: {
      projectType: "backend-service",
      language: "python",
      framework: "fastapi",
      blueprint: "python-fastapi-feature-modular",
      maturity: "standard",
      capabilities: ["unit-tests"]
    }
  };

  try {
    const savedPath = await saveProfileToVault(manifest, vault);
    assert.ok(savedPath.endsWith("custom-profile.json"));

    const content = await readFile(savedPath, "utf8");
    const parsed = JSON.parse(content);
    assert.equal(parsed.id, "custom-profile");

    const removed = await removeProfileFromVault("custom-profile", vault);
    assert.equal(removed, true);
  } finally {
    await rm(tmpVault, { recursive: true, force: true });
  }
});
