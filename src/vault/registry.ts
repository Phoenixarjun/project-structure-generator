import path from "node:path";
import { BLUEPRINT_FILE_NAME } from "../core/constants.js";
import { canonicalPath, isDirectory, pathExists } from "../core/fs.js";
import type {
  BlueprintRecord,
  BlueprintRegistry,
  LoadedConfig,
  VaultLocation
} from "../core/types.js";
import { loadBlueprintDirectory } from "../blueprint/loader.js";
import {
  builtInVault,
  configVaults,
  explicitVaults,
  userVault,
  workspaceVault
} from "./locations.js";
import { loadCatalogue } from "../catalogue/registry.js";

async function deduplicateVaults(vaults: VaultLocation[]): Promise<VaultLocation[]> {
  const seen = new Set<string>();
  const result: VaultLocation[] = [];

  for (const vault of vaults) {
    const key = await canonicalPath(vault.path);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(vault);
    }
  }

  return result;
}

export async function buildRegistry(options: {
  explicitVaultPaths?: string[] | undefined;
  config?: LoadedConfig | undefined;
  cwd?: string | undefined;
} = {}): Promise<BlueprintRegistry> {
  const cwd = options.cwd ?? process.cwd();
  const vaults = await deduplicateVaults([
    ...explicitVaults(options.explicitVaultPaths ?? []),
    ...configVaults(options.config),
    workspaceVault(cwd),
    userVault(),
    builtInVault()
  ]);

  const cat = await loadCatalogue(vaults);
  return {
    records: cat.blueprints,
    issues: cat.issues
  };
}

export function findBlueprint(registry: BlueprintRegistry, id: string): BlueprintRecord | undefined {
  return registry.records.find((record) => record.blueprint.id === id);
}
