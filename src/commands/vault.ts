import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import {
  CONFIG_FILE_NAME,
  VAULT_DIRECTORY_NAME,
  WORKSPACE_DIRECTORY_NAME
} from "../core/constants.js";
import { pathExists, resolveInside, writeJsonFile } from "../core/fs.js";
import { StructgenError } from "../core/errors.js";
import type { CaptureOptions, ProjectConfig, VaultLocation } from "../core/types.js";
import { loadBlueprintDirectory } from "../blueprint/loader.js";
import { captureBlueprint, importBlueprint } from "../vault/capture.js";
import { userVault, workspaceVault } from "../vault/locations.js";

export function resolveVaultScope(scope: string, cwd = process.cwd()): string {
  if (scope === "user") {
    return userVault().path;
  }
  if (scope === "workspace") {
    return workspaceVault(cwd).path;
  }
  return path.resolve(scope);
}

export async function runVaultInit(options: {
  scope: string;
  defaultPreset?: string | undefined;
  force: boolean;
}): Promise<void> {
  const vault = resolveVaultScope(options.scope);
  await mkdir(vault, { recursive: true });

  if (options.scope === "workspace") {
    const configPath = path.join(process.cwd(), CONFIG_FILE_NAME);
    if (!(await pathExists(configPath)) || options.force) {
      const config: ProjectConfig = {
        vaults: [path.join(WORKSPACE_DIRECTORY_NAME, VAULT_DIRECTORY_NAME)]
      };
      if (options.defaultPreset !== undefined) {
        config.defaultPreset = options.defaultPreset;
      }
      await writeJsonFile(configPath, config);
    }
  }

  process.stdout.write(`Initialized ${options.scope} vault at ${vault}\n`);
}

export async function runVaultCapture(options: CaptureOptions): Promise<void> {
  await mkdir(options.destinationVault, { recursive: true });
  const destination = await captureBlueprint(options);
  const vault: VaultLocation = { kind: "explicit", path: options.destinationVault, label: "capture" };
  const record = await loadBlueprintDirectory(destination, vault);
  process.stdout.write(`Captured ${record.blueprint.id}@${record.blueprint.version} to ${destination}\n`);
}

export async function runVaultImport(options: {
  sourceDirectory: string;
  destinationVault: string;
  force: boolean;
}): Promise<void> {
  const source = path.resolve(options.sourceDirectory);
  const vault: VaultLocation = { kind: "explicit", path: source, label: "import-source" };
  const record = await loadBlueprintDirectory(source, vault);
  const destination = await importBlueprint(source, options.destinationVault, record.blueprint.id, options.force);
  process.stdout.write(`Imported ${record.blueprint.id}@${record.blueprint.version} to ${destination}\n`);
}

export async function runVaultRemove(options: {
  id: string;
  destinationVault: string;
  yes: boolean;
}): Promise<void> {
  if (!options.yes) {
    throw new StructgenError("CONFIRMATION_REQUIRED", "Pass --yes to remove a blueprint from a vault");
  }

  const destination = resolveInside(options.destinationVault, options.id, "Blueprint removal target");
  if (!(await pathExists(destination))) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Blueprint not found in selected vault: ${options.id}`);
  }

  await rm(destination, { recursive: true, force: true });
  process.stdout.write(`Removed ${options.id} from ${options.destinationVault}\n`);
}
