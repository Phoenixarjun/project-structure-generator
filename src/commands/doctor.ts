import { access } from "node:fs/promises";
import { constants } from "node:fs";
import { MINIMUM_NODE_MAJOR } from "../core/constants.js";
import { ensureWritableDirectory } from "../core/fs.js";
import { buildRegistry } from "../vault/registry.js";
import { builtInVault, userVault } from "../vault/locations.js";

export async function runDoctor(json: boolean): Promise<void> {
  const nodeMajor = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  const nodeSupported = nodeMajor >= 18;
  const nodeMsg = nodeMajor >= MINIMUM_NODE_MAJOR
    ? `${process.versions.node} (LTS target ${MINIMUM_NODE_MAJOR})`
    : `${process.versions.node} (supported >=18, Node ${MINIMUM_NODE_MAJOR} LTS recommended)`;

  checks.push({
    name: "Node.js",
    ok: nodeSupported,
    detail: nodeMsg
  });

  try {
    await access(builtInVault().path, constants.R_OK);
    checks.push({ name: "Built-in vault", ok: true, detail: builtInVault().path });
  } catch {
    checks.push({ name: "Built-in vault", ok: false, detail: builtInVault().path });
  }

  try {
    await ensureWritableDirectory(userVault().path);
    checks.push({ name: "User vault", ok: true, detail: userVault().path });
  } catch (error) {
    checks.push({ name: "User vault", ok: false, detail: error instanceof Error ? error.message : String(error) });
  }

  const registry = await buildRegistry();
  checks.push({
    name: "Blueprint registry",
    ok: registry.records.length > 0 && registry.issues.length === 0,
    detail: `${registry.records.length} available, ${registry.issues.length} invalid`
  });

  if (json) {
    process.stdout.write(`${JSON.stringify({ ok: checks.every((check) => check.ok), checks }, null, 2)}\n`);
  } else {
    for (const check of checks) {
      process.stdout.write(`${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.detail}\n`);
    }
  }

  if (!checks.every((check) => check.ok)) {
    process.exitCode = 1;
  }
}
