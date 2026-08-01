import { findConfig } from "../config/loader.js";
import { StructgenError } from "../core/errors.js";
import { printBlueprint, printJson } from "../cli/output.js";
import { buildRegistry, findBlueprint } from "../vault/registry.js";

export async function runShow(options: { id: string; explicitVaults: string[]; json: boolean }): Promise<void> {
  const config = await findConfig();
  const registry = await buildRegistry({ explicitVaultPaths: options.explicitVaults, config });
  const record = findBlueprint(registry, options.id);

  if (!record) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Blueprint not found: ${options.id}`);
  }

  if (options.json) {
    printJson({ ...record.blueprint, vault: record.vault, directory: record.directory });
  } else {
    printBlueprint(record);
  }
}
