import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { loadBlueprintDirectory } from "../src/blueprint/loader.js";
import { createGenerationPlan } from "../src/engine/planner.js";
import { writeGenerationPlan } from "../src/engine/writer.js";
import { temporaryDirectory } from "./helpers.js";

void test("generates a built-in project and metadata", async () => {
  const temp = await temporaryDirectory("structgen-generation-");
  try {
    const blueprintDirectory = path.resolve("presets/builtin/python-fastapi-clean");
    const record = await loadBlueprintDirectory(blueprintDirectory, {
      kind: "builtin",
      path: path.dirname(blueprintDirectory),
      label: "test"
    });
    const output = path.join(temp.path, "billing-runtime");
    const values = {
      projectName: "billing-runtime",
      packageName: "billing_runtime",
      includeDocker: true
    };
    const plan = await createGenerationPlan(record, output, values);
    const result = await writeGenerationPlan(plan, { force: false, dryRun: false });

    assert.ok(result.createdFiles.includes("pyproject.toml"));
    const main = await readFile(path.join(output, "src", "billing_runtime", "main.py"), "utf8");
    assert.match(main, /billing_runtime/);
    const metadata = JSON.parse(await readFile(path.join(output, ".structgen.json"), "utf8")) as { blueprint: { id: string } };
    assert.equal(metadata.blueprint.id, "python-fastapi-clean");
  } finally {
    await temp.cleanup();
  }
});

void test("refuses to overwrite existing files without force", async () => {
  const temp = await temporaryDirectory("structgen-conflict-");
  try {
    const blueprintDirectory = path.resolve("presets/builtin/typescript-cli-modular");
    const record = await loadBlueprintDirectory(blueprintDirectory, {
      kind: "builtin",
      path: path.dirname(blueprintDirectory),
      label: "test"
    });
    const output = path.join(temp.path, "tool");
    const values = { projectName: "tool", packageName: "tool", commandName: "tool" };
    const plan = await createGenerationPlan(record, output, values);
    await writeGenerationPlan(plan, { force: false, dryRun: false });
    await assert.rejects(
      writeGenerationPlan(plan, { force: false, dryRun: false }),
      /Refusing to overwrite/
    );
  } finally {
    await temp.cleanup();
  }
});
