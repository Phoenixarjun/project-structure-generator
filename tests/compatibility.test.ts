import test from "node:test";
import assert from "node:assert/strict";
import { assertCompatibility, validateCompatibility } from "../src/catalogue/compatibility.js";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import type { BlueprintRecord, PackRecord } from "../src/core/types.js";

void test("compatibility engine accepts valid blueprint and pack selection", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const pyBp = catalogue.blueprints.find((b) => b.blueprint.id === "python-fastapi-feature-modular")!;
  const unitPack = catalogue.packs.find((p) => p.pack.id === "unit-tests")!;
  const dockerPack = catalogue.packs.find((p) => p.pack.id === "docker")!;

  const report = validateCompatibility(pyBp, "standard", [unitPack, dockerPack], catalogue);
  assert.equal(report.valid, true);
  assert.equal(report.issues.length, 0);
});

void test("compatibility engine rejects missing extension point with alternatives", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const nextBp = catalogue.blueprints.find((b) => b.blueprint.id === "nextjs-feature-modular")!;
  const otelPack = catalogue.packs.find((p) => p.pack.id === "opentelemetry")!;

  const report = validateCompatibility(nextBp, "standard", [otelPack], catalogue);
  assert.equal(report.valid, false);

  const issue = report.issues.find((i) => i.code === "MISSING_EXTENSION_POINT");
  assert.ok(issue);
  assert.ok(issue.alternatives?.includes("python-fastapi-feature-modular"));
});

void test("compatibility engine enforces pack conflicts", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const bp = catalogue.blueprints[0];
  assert.ok(bp);

  const packA: PackRecord = {
    pack: {
      schemaVersion: 1,
      id: "pack-a",
      name: "Pack A",
      category: "test",
      description: "Pack A",
      conflictsWith: ["pack-b"]
    },
    directory: "/tmp/a",
    manifestPath: "/tmp/a/pack.json",
    vault: { kind: "builtin", path: "/tmp", label: "test" }
  };

  const packB: PackRecord = {
    pack: {
      schemaVersion: 1,
      id: "pack-b",
      name: "Pack B",
      category: "test",
      description: "Pack B"
    },
    directory: "/tmp/b",
    manifestPath: "/tmp/b/pack.json",
    vault: { kind: "builtin", path: "/tmp", label: "test" }
  };

  const report = validateCompatibility(bp, "standard", [packA, packB], catalogue);
  assert.equal(report.valid, false);
  assert.ok(report.issues.some((i) => i.code === "CONFLICTING_PACKS"));
});
