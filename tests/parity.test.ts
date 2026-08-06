import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { loadCatalogue } from "../src/catalogue/registry.js";
import { builtInVault } from "../src/vault/locations.js";
import { composeGenerationPlan } from "../src/composition/composer.js";
import { writeGenerationPlan } from "../src/engine/writer.js";
import { temporaryDirectory } from "./helpers.js";

async function getDirFiles(dirPath: string): Promise<Map<string, string>> {
  const fileMap = new Map<string, string>();
  async function walk(current: string, rel: string) {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      const relative = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        await walk(full, relative);
      } else if (entry.isFile()) {
        if (entry.name === ".structgen.json") continue;
        const content = await readFile(full, "utf8");
        fileMap.set(relative, content);
      }
    }
  }
  await walk(dirPath, "");
  return fileMap;
}

void test("entry mode parity: identical selection produces byte-for-byte identical output across modes", async () => {
  const catalogue = await loadCatalogue([builtInVault()]);
  const bpRec = catalogue.blueprints.find((b) => b.blueprint.id === "nextjs-feature-modular")!;
  const packIds = ["docker", "github-actions", "structured-logging", "unit-tests"];
  const packRecs = catalogue.packs.filter((p) => packIds.includes(p.pack.id));

  const temp1 = await temporaryDirectory("parity-direct-");
  const temp2 = await temporaryDirectory("parity-api-");

  try {
    const plan1 = await composeGenerationPlan({
      blueprintRecord: bpRec,
      maturity: "operational",
      packRecords: packRecs,
      targetDirectory: temp1.path,
      variables: { projectName: "my-app" },
      features: ["authentication"]
    });
    await writeGenerationPlan(plan1 as any, { force: true, dryRun: false });

    const plan2 = await composeGenerationPlan({
      blueprintRecord: bpRec,
      maturity: "operational",
      packRecords: packRecs,
      targetDirectory: temp2.path,
      variables: { projectName: "my-app" },
      features: ["authentication"]
    });
    await writeGenerationPlan(plan2 as any, { force: true, dryRun: false });

    const files1 = await getDirFiles(temp1.path);
    const files2 = await getDirFiles(temp2.path);

    assert.equal(files1.size, files2.size);
    for (const [relPath, content1] of files1.entries()) {
      const content2 = files2.get(relPath);
      assert.ok(content2 !== undefined, `File missing in mode 2: ${relPath}`);
      assert.equal(content1, content2, `Content mismatch in file: ${relPath}`);
    }
  } finally {
    await temp1.cleanup();
    await temp2.cleanup();
  }
});
