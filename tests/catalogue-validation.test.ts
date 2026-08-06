import test from "node:test";
import assert from "node:assert/strict";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { validateCatalogue } from "../src/catalogue/catalogue-validator.js";
import { buildCatalogueMatrix } from "../src/catalogue/matrix.js";

void test("catalogue validation verifies all built-in blueprints, packs, and profiles", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);

  assert.equal(catalogue.blueprints.length, 23);
  assert.equal(catalogue.packs.length, 14);
  assert.equal(catalogue.profiles.length, 5);

  const issues = await validateCatalogue(catalogue);
  assert.equal(issues.length, 0, `Validation issues found: ${JSON.stringify(issues, null, 2)}`);
});

void test("catalogue matrix builds complete 23-row table", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const matrix = buildCatalogueMatrix(catalogue);

  assert.equal(matrix.length, 23);
  const ids = matrix.map((m) => m.id);
  assert.ok(ids.includes("python-fastapi-native"));
  assert.ok(ids.includes("java-spring-layered"));
  assert.ok(ids.includes("go-minimal"));
  assert.ok(ids.includes("react-simple"));
  assert.ok(ids.includes("nextjs-app-router-native"));
  assert.ok(ids.includes("typescript-cli-minimal"));
});
