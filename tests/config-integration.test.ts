import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { writeJsonFile } from "../src/core/fs.js";
import { temporaryDirectory } from "./helpers.js";

const execute = promisify(execFile);

void test("uses configured preset and interpolated output without repeated selection", async () => {
  const temp = await temporaryDirectory("structgen-config-");
  try {
    const blueprintDirectory = path.join(temp.path, ".structgen", "vault", "organization-service");
    await mkdir(blueprintDirectory, { recursive: true });
    await writeJsonFile(path.join(blueprintDirectory, "blueprint.json"), {
      schemaVersion: 1,
      id: "organization-service",
      version: "1.0.0",
      name: "Organization Service",
      description: "Organization default",
      variables: [
        { name: "projectName", prompt: "Project name", type: "string", required: true, transform: "kebab" }
      ],
      entries: [
        { type: "file", path: "README.md", content: "# {{projectName}}\n" }
      ]
    });
    await writeJsonFile(path.join(temp.path, "structgen.config.json"), {
      vaults: [".structgen/vault"],
      defaultPreset: "organization-service",
      output: "generated/{{projectName}}"
    });

    const cli = path.resolve("dist/src/cli.js");
    await execute(process.execPath, [cli, "create", "--set", "projectName=Billing Service", "--interactive=false"], {
      cwd: temp.path
    });

    const content = await readFile(path.join(temp.path, "generated", "billing-service", "README.md"), "utf8");
    assert.equal(content, "# billing-service\n");
  } finally {
    await temp.cleanup();
  }
});
