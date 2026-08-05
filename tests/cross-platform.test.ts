import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, stat, symlink, writeFile, chmod } from "node:fs/promises";
import path from "node:path";
import { createGenerationPlan } from "../src/engine/planner.js";
import { writeGenerationPlan } from "../src/engine/writer.js";
import { buildRegistry, findBlueprint } from "../src/vault/registry.js";
import type { BlueprintRecord, GenerationPlan } from "../src/core/types.js";
import { temporaryDirectory } from "./helpers.js";

void test("handles directory paths containing spaces and unicode characters", async () => {
  const temp = await temporaryDirectory("structgen-unicode-");
  try {
    const targetDir = path.join(temp.path, "path with spaces", "projekt-über-123", "こんにちは");
    const record: BlueprintRecord = {
      blueprint: {
        schemaVersion: 1,
        id: "unicode-test",
        version: "1.0.0",
        name: "Unicode Test",
        description: "Test unicode pathing",
        variables: [],
        entries: [
          { type: "file", path: "src/main.txt", content: "Hello Welt" }
        ]
      },
      directory: temp.path,
      manifestPath: path.join(temp.path, "blueprint.json"),
      vault: { kind: "explicit", path: temp.path, label: "test" }
    };

    const plan = await createGenerationPlan(record, targetDir, {});
    const result = await writeGenerationPlan(plan, { force: false, dryRun: false });

    assert.equal(result.createdFiles.length, 2);
    const content = await readFile(path.join(targetDir, "src", "main.txt"), "utf8");
    assert.equal(content, "Hello Welt");
  } finally {
    await temp.cleanup();
  }
});

void test("handles partially existing output directories without overwriting unrelated files", async () => {
  const temp = await temporaryDirectory("structgen-partial-");
  try {
    const targetDir = path.join(temp.path, "existing-app");
    await mkdir(targetDir, { recursive: true });
    await writeFile(path.join(targetDir, "existing.txt"), "keep me", "utf8");

    const record: BlueprintRecord = {
      blueprint: {
        schemaVersion: 1,
        id: "partial-test",
        version: "1.0.0",
        name: "Partial Test",
        description: "Test existing dir",
        variables: [],
        entries: [
          { type: "file", path: "new-file.txt", content: "new content" }
        ]
      },
      directory: temp.path,
      manifestPath: path.join(temp.path, "blueprint.json"),
      vault: { kind: "explicit", path: temp.path, label: "test" }
    };

    const plan = await createGenerationPlan(record, targetDir, {});
    const result = await writeGenerationPlan(plan, { force: false, dryRun: false });

    assert.equal(result.createdFiles.length, 2);
    assert.equal(await readFile(path.join(targetDir, "existing.txt"), "utf8"), "keep me");
    assert.equal(await readFile(path.join(targetDir, "new-file.txt"), "utf8"), "new content");
  } finally {
    await temp.cleanup();
  }
});

void test("preserves binary template files without text interpolation", async () => {
  const temp = await temporaryDirectory("structgen-binary-");
  try {
    const blueprintDir = path.join(temp.path, "binary-blueprint");
    await mkdir(path.join(blueprintDir, "template"), { recursive: true });
    const binaryData = Buffer.from([0x00, 0xff, 0xfe, 0x7f, 0x12, 0x34]);
    await writeFile(path.join(blueprintDir, "template", "sample.bin"), binaryData);

    const record: BlueprintRecord = {
      blueprint: {
        schemaVersion: 1,
        id: "binary-test",
        version: "1.0.0",
        name: "Binary Test",
        description: "Test binary template",
        variables: [],
        entries: [
          { type: "file", path: "sample.bin", source: "template/sample.bin", template: false }
        ]
      },
      directory: blueprintDir,
      manifestPath: path.join(blueprintDir, "blueprint.json"),
      vault: { kind: "explicit", path: temp.path, label: "test" }
    };

    const targetDir = path.join(temp.path, "output");
    const plan = await createGenerationPlan(record, targetDir, {});
    await writeGenerationPlan(plan, { force: false, dryRun: false });

    const readBytes = await readFile(path.join(targetDir, "sample.bin"));
    assert.deepEqual(readBytes, binaryData);
  } finally {
    await temp.cleanup();
  }
});

void test("sets executable file modes on file entries", async () => {
  const temp = await temporaryDirectory("structgen-mode-");
  try {
    const record: BlueprintRecord = {
      blueprint: {
        schemaVersion: 1,
        id: "mode-test",
        version: "1.0.0",
        name: "Mode Test",
        description: "Test mode",
        variables: [],
        entries: [
          { type: "file", path: "bin/run", content: "#!/bin/sh\necho hi", mode: 493 }
        ]
      },
      directory: temp.path,
      manifestPath: path.join(temp.path, "blueprint.json"),
      vault: { kind: "explicit", path: temp.path, label: "test" }
    };

    const targetDir = path.join(temp.path, "output");
    const plan = await createGenerationPlan(record, targetDir, {});
    await writeGenerationPlan(plan, { force: false, dryRun: false });

    const fileStat = await stat(path.join(targetDir, "bin", "run"));
    assert.ok(fileStat.isFile());
    if (process.platform !== "win32") {
      assert.equal(fileStat.mode & 0o777, 0o755);
    }
  } finally {
    await temp.cleanup();
  }
});

void test("discovers blueprints from a symlinked vault directory", { skip: process.platform === "win32" }, async () => {
  const temp = await temporaryDirectory("structgen-symvault-");
  try {
    const realVault = path.join(temp.path, "real-vault");
    const linkedVault = path.join(temp.path, "linked-vault");
    const bpDir = path.join(realVault, "my-preset");
    await mkdir(bpDir, { recursive: true });
    await writeFile(
      path.join(bpDir, "blueprint.json"),
      JSON.stringify({
        schemaVersion: 1,
        id: "my-preset",
        version: "1.0.0",
        name: "Symlinked Blueprint",
        description: "Test blueprint in symlinked vault",
        variables: [],
        entries: []
      }),
      "utf8"
    );

    await symlink(realVault, linkedVault, "dir");

    const registry = await buildRegistry({ explicitVaultPaths: [linkedVault] });
    const record = findBlueprint(registry, "my-preset");
    assert.ok(record);
    assert.equal(record.blueprint.id, "my-preset");
  } finally {
    await temp.cleanup();
  }
});
