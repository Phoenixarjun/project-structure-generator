import path from "node:path";
import { loadBlueprintDirectory } from "../blueprint/loader.js";
import type { VaultLocation } from "../core/types.js";
import { printJson } from "../cli/output.js";

export async function runValidate(directory: string, json: boolean): Promise<void> {
  const resolved = path.resolve(directory);
  const vault: VaultLocation = { kind: "explicit", path: resolved, label: "validation" };
  const record = await loadBlueprintDirectory(resolved, vault);

  if (json) {
    printJson({ valid: true, blueprint: record.blueprint });
  } else {
    process.stdout.write(`Valid blueprint: ${record.blueprint.id}@${record.blueprint.version}\n`);
  }
}
