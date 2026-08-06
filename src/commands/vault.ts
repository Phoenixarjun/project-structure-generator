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
import { resolveVaultSequence, userVault, workspaceVault } from "../vault/locations.js";
import { loadCatalogue } from "../catalogue/registry.js";
import { findBlueprintById, findPackById, findProfileById } from "../catalogue/query.js";
import { printJson } from "../cli/output.js";

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
  await mkdir(path.join(vault, "blueprints"), { recursive: true });
  await mkdir(path.join(vault, "packs"), { recursive: true });
  await mkdir(path.join(vault, "profiles"), { recursive: true });

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

export async function runVaultList(options: {
  type?: "blueprint" | "pack" | "profile";
  scope?: string;
  explicitVaults?: string[];
  json?: boolean;
}): Promise<void> {
  const vaults = resolveVaultSequence(options.explicitVaults ?? []);
  const catalogue = await loadCatalogue(vaults);

  const type = options.type ?? "blueprint";

  if (options.json) {
    if (type === "pack") printJson(catalogue.packs);
    else if (type === "profile") printJson(catalogue.profiles);
    else printJson(catalogue.blueprints);
    return;
  }

  if (type === "pack") {
    if (catalogue.packs.length === 0) {
      process.stdout.write("No capability packs found.\n");
      return;
    }
    for (const p of catalogue.packs) {
      process.stdout.write(`${p.pack.id.padEnd(25)} ${p.pack.name} (${p.vault.label})\n`);
    }
  } else if (type === "profile") {
    if (catalogue.profiles.length === 0) {
      process.stdout.write("No profiles found.\n");
      return;
    }
    for (const p of catalogue.profiles) {
      process.stdout.write(`${p.profile.id.padEnd(25)} ${p.profile.name} (${p.vault.label})\n`);
    }
  } else {
    if (catalogue.blueprints.length === 0) {
      process.stdout.write("No blueprints found.\n");
      return;
    }
    for (const b of catalogue.blueprints) {
      process.stdout.write(`${b.blueprint.id.padEnd(30)} ${b.blueprint.name} (${b.vault.label})\n`);
    }
  }
}

export async function runVaultInspect(
  id: string,
  options: { explicitVaults?: string[]; json?: boolean }
): Promise<void> {
  const vaults = resolveVaultSequence(options.explicitVaults ?? []);
  const catalogue = await loadCatalogue(vaults);

  const bp = findBlueprintById(catalogue, id);
  const pack = findPackById(catalogue, id);
  const profile = findProfileById(catalogue, id);

  const found = bp ?? pack ?? profile;
  if (!found) {
    throw new StructgenError("RESOURCE_NOT_FOUND", `Resource not found in vault: ${id}`);
  }

  if (options.json) {
    printJson(found);
  } else {
    process.stdout.write(`Vault Resource: ${id}\n`);
    process.stdout.write(`Vault: ${found.vault.label}\n`);
    process.stdout.write(`Path: ${found.manifestPath}\n`);
  }
}

export async function runVaultValidate(options: {
  scope?: string;
  explicitVaults?: string[];
}): Promise<void> {
  const vaults = resolveVaultSequence(options.explicitVaults ?? []);
  const catalogue = await loadCatalogue(vaults);

  if (catalogue.issues.length > 0) {
    process.stdout.write(`Vault validation found ${catalogue.issues.length} issue(s):\n`);
    for (const issue of catalogue.issues) {
      process.stdout.write(`- ${issue.path}: ${issue.message}\n`);
    }
  } else {
    process.stdout.write(`[OK] All vault resources valid.\n`);
  }
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

  const bpDest = resolveInside(options.destinationVault, options.id, "Removal target");
  const subDest = resolveInside(path.join(options.destinationVault, "blueprints"), options.id, "Removal target");

  let target = bpDest;
  if (!(await pathExists(target)) && (await pathExists(subDest))) {
    target = subDest;
  }

  if (!(await pathExists(target))) {
    throw new StructgenError("BLUEPRINT_NOT_FOUND", `Resource not found in selected vault: ${options.id}`);
  }

  await rm(target, { recursive: true, force: true });
  process.stdout.write(`Removed ${options.id} from ${options.destinationVault}\n`);
}
