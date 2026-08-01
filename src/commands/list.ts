import { findConfig } from "../config/loader.js";
import { printJson, printRegistry } from "../cli/output.js";
import { buildRegistry } from "../vault/registry.js";

export async function runList(options: { explicitVaults: string[]; json: boolean }): Promise<void> {
  const config = await findConfig();
  const registry = await buildRegistry({ explicitVaultPaths: options.explicitVaults, config });

  if (options.json) {
    printJson({
      blueprints: registry.records.map((record) => ({
        ...record.blueprint,
        vault: record.vault,
        directory: record.directory
      })),
      issues: registry.issues
    });
  } else {
    printRegistry(registry.records, registry.issues);
  }
}
