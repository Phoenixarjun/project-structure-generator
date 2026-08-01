import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { captureBlueprint } from "../src/vault/capture.js";
import { temporaryDirectory } from "./helpers.js";

void test("captures a project into a reusable blueprint", async () => {
  const temp = await temporaryDirectory("structgen-capture-");
  try {
    const source = path.join(temp.path, "billing-service");
    const vault = path.join(temp.path, "vault");
    await mkdir(path.join(source, "src", "billing-service"), { recursive: true });
    await writeFile(path.join(source, "README.md"), "# billing-service\n", "utf8");
    await writeFile(path.join(source, "src", "billing-service", "main.txt"), "billing-service\n", "utf8");

    const destination = await captureBlueprint({
      sourceDirectory: source,
      destinationVault: vault,
      id: "billing-template",
      name: "Billing Template",
      description: "Captured test template",
      version: "1.0.0",
      replacements: [{
        from: "billing-service",
        variable: "projectName",
        prompt: "Project name",
        transform: "kebab"
      }],
      excludes: [],
      maxFileSize: 1_048_576,
      force: false,
      allowSensitive: false
    });

    const manifest = JSON.parse(await readFile(path.join(destination, "blueprint.json"), "utf8")) as {
      entries: Array<{ path: string }>;
    };
    assert.ok(manifest.entries.some((entry) => entry.path.includes("{{projectName}}")));
  } finally {
    await temp.cleanup();
  }
});
