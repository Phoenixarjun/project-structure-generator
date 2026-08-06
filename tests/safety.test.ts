import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readdir, symlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createGenerationPlan } from "../src/engine/planner.js";
import { writeGenerationPlan } from "../src/engine/writer.js";
import { captureBlueprint } from "../src/vault/capture.js";
import { runVaultRemove } from "../src/commands/vault.js";
import type { BlueprintRecord, GenerationPlan } from "../src/core/types.js";
import { temporaryDirectory } from "./helpers.js";

void test("rejects file and child output hierarchy conflicts", async () => {
  const record: BlueprintRecord = {
    blueprint: {
      schemaVersion: 1,
      id: "hierarchy-conflict",
      version: "1.0.0",
      name: "Hierarchy Conflict",
      description: "Invalid generated hierarchy",
      variables: [],
      entries: [
        { type: "file", path: "src", content: "file" },
        { type: "file", path: "src/main.ts", content: "child" }
      ]
    },
    directory: process.cwd(),
    manifestPath: path.join(process.cwd(), "blueprint.json"),
    vault: { kind: "explicit", path: process.cwd(), label: "test" }
  };

  await assert.rejects(
    createGenerationPlan(record, path.join(process.cwd(), "output"), {}),
    /File and child path conflict/
  );
});

void test("rejects a symlink target root", { skip: process.platform === "win32" }, async () => {
  const temp = await temporaryDirectory("structgen-symlink-");
  try {
    const real = path.join(temp.path, "real");
    const linked = path.join(temp.path, "linked");
    await mkdir(real);
    await symlink(real, linked, "dir");

    const plan: GenerationPlan = {
      blueprint: {
        blueprint: {
          schemaVersion: 1,
          id: "symlink-test",
          version: "1.0.0",
          name: "Symlink Test",
          description: "Symlink test",
          variables: [],
          entries: [{ type: "file", path: "README.md", content: "x" }]
        },
        directory: temp.path,
        manifestPath: path.join(temp.path, "blueprint.json"),
        vault: { kind: "explicit", path: temp.path, label: "test" }
      },
      maturity: "standard",
      packs: [],
      targetDirectory: linked,
      variables: {},
      entries: [{ type: "file", relativePath: "README.md", content: Buffer.from("x") }]
    };

    await assert.rejects(
      writeGenerationPlan(plan, { force: false, dryRun: false }),
      /symlink root/
    );
  } finally {
    await temp.cleanup();
  }
});

void test("failed sensitive capture leaves no partial blueprint", async () => {
  const temp = await temporaryDirectory("structgen-sensitive-");
  try {
    const source = path.join(temp.path, "source-project");
    const vault = path.join(temp.path, "vault");
    await mkdir(source);
    await writeFile(path.join(source, "config.txt"), "api_key=1234567890-secret-value", "utf8");

    await assert.rejects(
      captureBlueprint({
        sourceDirectory: source,
        destinationVault: vault,
        id: "sensitive-template",
        name: "Sensitive Template",
        description: "Sensitive test",
        version: "1.0.0",
        replacements: [{ from: "source-project", variable: "projectName", prompt: "Project name" }],
        excludes: [],
        maxFileSize: 1_048_576,
        force: false,
        allowSensitive: false
      }),
      /Potential secret detected/
    );

    assert.deepEqual(await readdir(vault), []);
  } finally {
    await temp.cleanup();
  }
});

void test("vault removal cannot escape its root", async () => {
  const temp = await temporaryDirectory("structgen-remove-");
  try {
    const vault = path.join(temp.path, "vault");
    const outside = path.join(temp.path, "outside");
    await mkdir(vault);
    await mkdir(outside);
    await writeFile(path.join(outside, "keep.txt"), "keep", "utf8");

    await assert.rejects(
      runVaultRemove({ id: "../outside", destinationVault: vault, yes: true }),
      /cannot escape/
    );

    assert.deepEqual(await readdir(outside), ["keep.txt"]);
  } finally {
    await temp.cleanup();
  }
});
