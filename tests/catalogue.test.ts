import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { mkdir, writeFile, rm } from "node:fs/promises";
import { loadCatalogueFromVault, resetLegacyVaultWarning } from "../src/catalogue/loader.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { builtInVault } from "../src/vault/locations.js";
import type { VaultLocation } from "../src/core/types.js";

void test("catalogue loader discovers built-in base blueprints and packs", async () => {
  const builtin = builtInVault();
  const cat = await loadCatalogueFromVault(builtin);

  assert.ok(cat.blueprints.length > 0);
  assert.ok(cat.packs.length > 0);

  const pyBp = cat.blueprints.find((b) => b.blueprint.id === "python-fastapi-feature-modular");
  assert.ok(pyBp);
  assert.equal(pyBp.blueprint.projectType, "backend-service");
  assert.equal(pyBp.blueprint.language, "python");
  assert.equal(pyBp.blueprint.framework, "fastapi");

  const dockerPack = cat.packs.find((p) => p.pack.id === "docker");
  assert.ok(dockerPack);
});

void test("catalogue loader handles legacy flat vault layout with process warning", async () => {
  const tmpDir = path.join(process.cwd(), "temp-legacy-vault-test");
  await mkdir(path.join(tmpDir, "my-flat-blueprint"), { recursive: true });

  const bpJson = {
    schemaVersion: 1,
    id: "my-flat-blueprint",
    version: "1.0.0",
    name: "Flat BP",
    description: "Flat",
    variables: [],
    entries: []
  };

  await writeFile(
    path.join(tmpDir, "my-flat-blueprint", "blueprint.json"),
    JSON.stringify(bpJson, null, 2),
    "utf8"
  );

  resetLegacyVaultWarning();
  const vault: VaultLocation = { kind: "workspace", path: tmpDir, label: "legacy" };

  let stderrOutput = "";
  const originalStderrWrite = process.stderr.write;
  process.stderr.write = ((chunk: any) => {
    stderrOutput += String(chunk);
    return true;
  }) as any;

  try {
    const cat = await loadCatalogueFromVault(vault);
    assert.equal(cat.blueprints.length, 1);
    assert.equal(cat.blueprints[0]?.blueprint.id, "my-flat-blueprint");
    assert.ok(stderrOutput.includes("Legacy vault layout detected"));
  } finally {
    process.stderr.write = originalStderrWrite;
    await rm(tmpDir, { recursive: true, force: true });
  }
});
