import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { builtInVault } from "../src/vault/locations.js";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { runCreate } from "../src/commands/create.js";
import { temporaryDirectory } from "./helpers.js";

void test("all 23 built-in base blueprints generate valid projects", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  assert.equal(catalogue.blueprints.length, 23);

  for (const bpRec of catalogue.blueprints) {
    const bpId = bpRec.blueprint.id;
    const temp = await temporaryDirectory(`smoke-bp-${bpId}-`);
    try {
      const outputDir = path.join(temp.path, "out-app");
      await runCreate({
        presetId: bpId,
        output: outputDir,
        values: { projectName: "out-app" },
        force: false,
        dryRun: false,
        interactive: false,
        explicitVaults: [],
        json: false
      });

      const provFile = path.join(outputDir, ".structgen.json");
      const provContent = await readFile(provFile, "utf8");
      const prov = JSON.parse(provContent);
      assert.equal(prov.blueprint.id, bpId);
      assert.ok(prov.files.length > 0);
    } finally {
      await temp.cleanup();
    }
  }
});
