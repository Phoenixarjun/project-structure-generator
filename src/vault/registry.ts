import { readdir } from "node:fs/promises";
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

async function findBlueprintDirectories(root: string): Promise<string[]> {
  if (!(await isDirectory(root))) {
    return [];
  }

  const results: string[] = [];
  const queue: Array<{ directory: string; depth: number }> = [{ directory: root, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    if (await pathExists(path.join(current.directory, BLUEPRINT_FILE_NAME))) {
      results.push(current.directory);
      continue;
    }

    if (current.depth >= 3) {
      continue;
    }

    const entries = await readdir(current.directory, { withFileTypes: true });
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
      if (entry.isDirectory() && !entry.isSymbolicLink()) {
        queue.push({ directory: path.join(current.directory, entry.name), depth: current.depth + 1 });
      }
    }
  }

  return results;
}

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

  const records: BlueprintRecord[] = [];
  const issues: BlueprintRegistry["issues"] = [];
  const claimed = new Set<string>();

  for (const vault of vaults) {
    const directories = await findBlueprintDirectories(vault.path);
    for (const directory of directories) {
      try {
        const record = await loadBlueprintDirectory(directory, vault);
        if (!claimed.has(record.blueprint.id)) {
          claimed.add(record.blueprint.id);
          records.push(record);
        }
      } catch (error) {
        issues.push({
          path: directory,
          message: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  records.sort((left, right) => left.blueprint.id.localeCompare(right.blueprint.id));
  return { records, issues };
}

export function findBlueprint(registry: BlueprintRegistry, id: string): BlueprintRecord | undefined {
  return registry.records.find((record) => record.blueprint.id === id);
}
