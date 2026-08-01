import test from "node:test";
import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { writeJsonFile } from "../src/core/fs.js";
import { buildRegistry, findBlueprint } from "../src/vault/registry.js";
import { temporaryDirectory } from "./helpers.js";

void test("explicit vault overrides built-in blueprint with the same id", async () => {
  const temp = await temporaryDirectory("structgen-registry-");
  try {
    const directory = path.join(temp.path, "python-fastapi-clean");
    await mkdir(directory, { recursive: true });
    await writeJsonFile(path.join(directory, "blueprint.json"), {
      schemaVersion: 1,
      id: "python-fastapi-clean",
      version: "9.0.0",
      name: "Organization FastAPI",
      description: "Organization override",
      variables: [],
      entries: [{ type: "file", path: "README.md", content: "organization" }]
    });

    const registry = await buildRegistry({ explicitVaultPaths: [temp.path], cwd: temp.path });
    const record = findBlueprint(registry, "python-fastapi-clean");
    assert.equal(record?.blueprint.version, "9.0.0");
    assert.equal(record?.vault.kind, "explicit");
  } finally {
    await temp.cleanup();
  }
});
